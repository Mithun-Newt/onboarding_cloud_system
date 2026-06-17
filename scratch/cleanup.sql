UPDATE admission_applications SET status = 'CONFIRMED' WHERE status = 'TC_ISSUED';
DELETE FROM admission_status_history WHERE "toStatus" = 'TC_ISSUED' OR "fromStatus" = 'TC_ISSUED';
DROP TABLE IF EXISTS transfer_certificates CASCADE;
