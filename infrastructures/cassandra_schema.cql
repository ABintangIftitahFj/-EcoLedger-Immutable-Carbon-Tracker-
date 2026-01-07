CREATE KEYSPACE IF NOT EXISTS eco_logs 
WITH replication = {'class': 'SimpleStrategy', 'replication_factor': 1};

USE eco_logs;

CREATE TABLE IF NOT EXISTS activity_audit (
    user_id text,
    activity_time timestamp,
    audit_id uuid,
    action_type text,
    entity text,
    entity_id text,
    changes map<text, text>,
    ip_address text,
    user_name text,
    user_organisasi text,
    description text,
    PRIMARY KEY ((user_id), activity_time, audit_id)
) WITH CLUSTERING ORDER BY (activity_time DESC);