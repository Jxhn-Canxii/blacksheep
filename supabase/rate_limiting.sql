-- Simple Rate Limiting Trigger Function
CREATE OR REPLACE FUNCTION check_rate_limit()
RETURNS TRIGGER AS $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM vents
    WHERE user_id = auth.uid()
    AND created_at > now() - interval '10 seconds'
  ) THEN
    RAISE EXCEPTION 'Neural link vibrating too fast. Please wait 10 seconds.';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Apply rate limit to vents
DROP TRIGGER IF EXISTS tr_check_vent_rate_limit ON vents;
CREATE TRIGGER tr_check_vent_rate_limit
BEFORE INSERT ON vents
FOR EACH ROW EXECUTE PROCEDURE check_rate_limit();

-- Rate limit for replies
CREATE OR REPLACE FUNCTION check_reply_rate_limit()
RETURNS TRIGGER AS $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM replies
    WHERE user_id = auth.uid()
    AND created_at > now() - interval '3 seconds'
  ) THEN
    RAISE EXCEPTION 'Signal frequency too high. Please wait 3 seconds.';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS tr_check_reply_rate_limit ON replies;
CREATE TRIGGER tr_check_reply_rate_limit
BEFORE INSERT ON replies
FOR EACH ROW EXECUTE PROCEDURE check_reply_rate_limit();
