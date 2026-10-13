-- Apply after 20261013_production_security.sql. No session settings change.
BEGIN;

CREATE INDEX IF NOT EXISTS orders_created_id_idx ON public.orders(created_at DESC, id DESC);
CREATE INDEX IF NOT EXISTS orders_completed_created_idx ON public.orders(created_at DESC) WHERE status = 'completed';
CREATE INDEX IF NOT EXISTS orders_customer_created_idx ON public.orders(customer_id, created_at DESC);
CREATE INDEX IF NOT EXISTS orders_phone_created_idx ON public.orders(customer_phone, created_at DESC);
CREATE INDEX IF NOT EXISTS customers_last_visit_idx ON public.customers(last_visit DESC NULLS LAST, id DESC);
CREATE INDEX IF NOT EXISTS franchise_status_created_idx ON public.franchise_applications(status,created_at DESC,id DESC);
CREATE INDEX IF NOT EXISTS franchise_created_idx ON public.franchise_applications(created_at DESC,id DESC);
CREATE INDEX IF NOT EXISTS api_rate_limits_window_idx ON public.api_rate_limits(window_started);

-- Avoid sweeping the rate table on every authenticated request/checkout.
-- Cleanup is bounded and opportunistic; expired buckets still reset immediately.
CREATE OR REPLACE FUNCTION public.take_rate_limit(p_key TEXT, p_limit INTEGER, p_seconds INTEGER) RETURNS BOOLEAN
LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE n INTEGER; BEGIN
  INSERT INTO public.api_rate_limits AS r (key, window_started, hits) VALUES (p_key, now(), 1)
  ON CONFLICT (key) DO UPDATE SET
    hits = CASE WHEN r.window_started <= now() - make_interval(secs => p_seconds) THEN 1 ELSE r.hits + 1 END,
    window_started = CASE WHEN r.window_started <= now() - make_interval(secs => p_seconds) THEN now() ELSE r.window_started END
  RETURNING hits INTO n;
  IF random() < 0.01 THEN
    DELETE FROM public.api_rate_limits WHERE key IN (
      SELECT key FROM public.api_rate_limits WHERE window_started < now() - interval '2 days' LIMIT 100
    );
  END IF;
  RETURN n <= p_limit;
END; $$;
REVOKE ALL ON FUNCTION public.take_rate_limit(TEXT,INTEGER,INTEGER) FROM PUBLIC, anon, authenticated;

-- One small response replaces downloading and reducing complete order history.
-- SECURITY DEFINER is guarded by the same live staff lookup as checkout/RLS.
CREATE OR REPLACE FUNCTION public.sales_summary(p_range TEXT DEFAULT 'weekly') RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE
  v_today DATE := (now() AT TIME ZONE 'Asia/Kolkata')::DATE;
  v_first DATE; v_end DATE; v_step INTERVAL; v_bucket TEXT; v_label TEXT;
  v_totals JSONB; v_chart JSONB; v_products JSONB;
BEGIN
  IF public.current_staff_role() IS NULL OR public.current_staff_role() NOT IN ('admin','manager') THEN
    RAISE EXCEPTION 'Management access required' USING ERRCODE = '42501';
  END IF;
  IF p_range IS NULL OR p_range NOT IN ('daily','weekly','monthly','yearly') THEN
    RAISE EXCEPTION 'Invalid range' USING ERRCODE = '22023';
  END IF;
  IF NOT public.take_rate_limit('analytics:' || auth.uid()::TEXT, 300, 60) THEN
    RAISE EXCEPTION 'Too many requests' USING ERRCODE = 'P0001';
  END IF;
  v_first := CASE p_range WHEN 'daily' THEN v_today WHEN 'weekly' THEN v_today - 6
    WHEN 'monthly' THEN date_trunc('year',v_today)::DATE
    ELSE (date_trunc('year',v_today) - interval '2 years')::DATE END;
  v_end := v_today + 1;
  v_step := CASE p_range WHEN 'daily' THEN interval '1 hour' WHEN 'weekly' THEN interval '1 day'
    WHEN 'monthly' THEN interval '1 month' ELSE interval '1 year' END;
  v_bucket := CASE p_range WHEN 'daily' THEN 'hour' WHEN 'weekly' THEN 'day' WHEN 'monthly' THEN 'month' ELSE 'year' END;
  v_label := CASE p_range WHEN 'daily' THEN 'HH24:MI' WHEN 'weekly' THEN 'Dy (DD/MM)' WHEN 'monthly' THEN 'Mon' ELSE 'YYYY' END;

  SELECT jsonb_build_object('totalRevenue',coalesce(sum(o.total),0),'totalOrders',count(*),
    'avgOrderValue',coalesce(avg(o.total),0),'uniqueCustomers',count(DISTINCT nullif(o.customer_phone,'0000000000')))
  INTO v_totals FROM public.orders o WHERE o.status='completed'
    AND o.created_at >= (v_first::TIMESTAMP AT TIME ZONE 'Asia/Kolkata')
    AND o.created_at < (v_end::TIMESTAMP AT TIME ZONE 'Asia/Kolkata');

  WITH buckets AS (
    SELECT date_trunc(v_bucket,o.created_at AT TIME ZONE 'Asia/Kolkata') AS bucket,
      sum(o.total) AS revenue,count(*) AS orders
    FROM public.orders o WHERE o.status='completed'
      AND o.created_at >= (v_first::TIMESTAMP AT TIME ZONE 'Asia/Kolkata')
      AND o.created_at < (v_end::TIMESTAMP AT TIME ZONE 'Asia/Kolkata') GROUP BY 1
  ), series AS (
    SELECT generate_series(v_first::TIMESTAMP,
      CASE p_range WHEN 'daily' THEN v_today::TIMESTAMP + interval '23 hours'
      WHEN 'weekly' THEN v_today::TIMESTAMP WHEN 'monthly' THEN date_trunc('year',v_today) + interval '11 months'
      ELSE date_trunc('year',v_today) END, v_step) AS bucket
  )
  SELECT coalesce(jsonb_agg(jsonb_build_object('date',to_char(s.bucket,v_label),'revenue',coalesce(b.revenue,0),
    'orders',coalesce(b.orders,0)) ORDER BY s.bucket),'[]'::JSONB) INTO v_chart
  FROM series s LEFT JOIN buckets b USING(bucket);

  SELECT coalesce(jsonb_agg(to_jsonb(p) ORDER BY p.revenue DESC,p.name),'[]'::JSONB) INTO v_products FROM (
    SELECT item->>'name' AS name,sum(coalesce((item->>'qty')::NUMERIC,1)) AS orders,
      sum(coalesce((item->>'total')::NUMERIC,(item->>'price')::NUMERIC * coalesce((item->>'qty')::NUMERIC,1),0)) AS revenue
    FROM public.orders o CROSS JOIN LATERAL jsonb_array_elements(o.items) item
    WHERE o.status='completed' AND o.created_at >= (v_first::TIMESTAMP AT TIME ZONE 'Asia/Kolkata')
      AND o.created_at < (v_end::TIMESTAMP AT TIME ZONE 'Asia/Kolkata')
      AND coalesce(item->>'product_id','') <> 'meta_staff' AND coalesce(item->>'name','') NOT LIKE 'Billed by:%'
    GROUP BY item->>'name' ORDER BY revenue DESC,name LIMIT 10
  ) p;
  RETURN v_totals || jsonb_build_object('chartData',v_chart,'topProducts',v_products,'range',p_range,
    'periodStart',v_first::TIMESTAMP AT TIME ZONE 'Asia/Kolkata','periodEnd',v_end::TIMESTAMP AT TIME ZONE 'Asia/Kolkata');
END; $$;
REVOKE ALL ON FUNCTION public.sales_summary(TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.sales_summary(TEXT) TO authenticated;

CREATE OR REPLACE FUNCTION public.dashboard_summary() RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE
  v_today DATE := (now() AT TIME ZONE 'Asia/Kolkata')::DATE;
  v_month DATE := date_trunc('month',v_today)::DATE;
  v_stats JSONB; v_recent JSONB; v_chart JSONB; v_products JSONB;
BEGIN
  IF public.current_staff_role() IS NULL OR public.current_staff_role() NOT IN ('admin','manager') THEN
    RAISE EXCEPTION 'Management access required' USING ERRCODE = '42501';
  END IF;
  IF NOT public.take_rate_limit('dashboard:' || auth.uid()::TEXT,300,60) THEN
    RAISE EXCEPTION 'Too many requests' USING ERRCODE = 'P0001';
  END IF;
  SELECT jsonb_build_object('todayRevenue',coalesce(sum(o.total) FILTER (WHERE o.created_at >= (v_today::TIMESTAMP AT TIME ZONE 'Asia/Kolkata')),0),
    'todayOrders',count(*) FILTER (WHERE o.created_at >= (v_today::TIMESTAMP AT TIME ZONE 'Asia/Kolkata')),
    'monthlyRevenue',coalesce(sum(o.total),0),'activeCustomers',(SELECT count(*) FROM public.customers))
  INTO v_stats FROM public.orders o WHERE o.status='completed'
    AND o.created_at >= (v_month::TIMESTAMP AT TIME ZONE 'Asia/Kolkata')
    AND o.created_at < ((v_today + 1)::TIMESTAMP AT TIME ZONE 'Asia/Kolkata');

  SELECT coalesce(jsonb_agg(to_jsonb(r) ORDER BY r.created_at DESC,r.id DESC),'[]'::JSONB) INTO v_recent FROM (
    SELECT o.id,o.bill_no,o.customer_name,o.customer_phone,o.items,o.total,o.payment_method,o.created_at
    FROM public.orders o WHERE o.status='completed' ORDER BY o.created_at DESC,o.id DESC LIMIT 5
  ) r;
  WITH daily AS (
    SELECT (o.created_at AT TIME ZONE 'Asia/Kolkata')::DATE AS day,sum(o.total) AS revenue
    FROM public.orders o WHERE o.status='completed'
      AND o.created_at >= ((v_today - 6)::TIMESTAMP AT TIME ZONE 'Asia/Kolkata')
      AND o.created_at < ((v_today + 1)::TIMESTAMP AT TIME ZONE 'Asia/Kolkata') GROUP BY 1
  ) SELECT jsonb_agg(jsonb_build_object('date',to_char(s.day,'Dy'),'revenue',coalesce(d.revenue,0)) ORDER BY s.day)
    INTO v_chart FROM generate_series((v_today-6)::TIMESTAMP,v_today::TIMESTAMP,interval '1 day') s(day)
    LEFT JOIN daily d ON d.day=s.day::DATE;

  SELECT coalesce(jsonb_agg(to_jsonb(p) ORDER BY p.revenue DESC,p.name),'[]'::JSONB) INTO v_products FROM (
    SELECT item->>'name' AS name,sum(coalesce((item->>'qty')::NUMERIC,1)) AS orders,
      sum(coalesce((item->>'total')::NUMERIC,(item->>'price')::NUMERIC * coalesce((item->>'qty')::NUMERIC,1),0)) AS revenue
    FROM public.orders o CROSS JOIN LATERAL jsonb_array_elements(o.items) item
    WHERE o.status='completed' AND o.created_at >= ((v_today - 29)::TIMESTAMP AT TIME ZONE 'Asia/Kolkata')
      AND o.created_at < ((v_today + 1)::TIMESTAMP AT TIME ZONE 'Asia/Kolkata')
      AND coalesce(item->>'product_id','') <> 'meta_staff' AND coalesce(item->>'name','') NOT LIKE 'Billed by:%'
    GROUP BY item->>'name' ORDER BY revenue DESC,name LIMIT 4
  ) p;
  RETURN jsonb_build_object('stats',v_stats,'recentBills',v_recent,'chartData',v_chart,'topProducts',v_products);
END; $$;
REVOKE ALL ON FUNCTION public.dashboard_summary() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.dashboard_summary() TO authenticated;

CREATE OR REPLACE FUNCTION public.customer_summary() RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
BEGIN
  IF public.current_staff_role() IS NULL OR public.current_staff_role() NOT IN ('admin','manager') THEN
    RAISE EXCEPTION 'Management access required' USING ERRCODE = '42501';
  END IF;
  IF NOT public.take_rate_limit('customer-summary:' || auth.uid()::TEXT,300,60) THEN
    RAISE EXCEPTION 'Too many requests' USING ERRCODE = 'P0001';
  END IF;
  RETURN (SELECT jsonb_build_object('count',count(*),'loyaltyPoints',coalesce(sum(loyalty_points),0),
    'revenue',coalesce(sum(total_purchase),0)) FROM public.customers);
END; $$;
REVOKE ALL ON FUNCTION public.customer_summary() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.customer_summary() TO authenticated;

NOTIFY pgrst, 'reload schema';
COMMIT;
