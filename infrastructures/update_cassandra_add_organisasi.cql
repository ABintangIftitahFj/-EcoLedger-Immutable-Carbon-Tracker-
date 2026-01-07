-- Script untuk menambahkan kolom organisasi ke tabel activity_audit
-- Run this script if the table already exists

USE eco_logs;

ALTER TABLE activity_audit ADD user_name text;
ALTER TABLE activity_audit ADD user_organisasi text;
