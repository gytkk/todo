-- PostgreSQL initialization script for Todo App
-- This script creates necessary extensions and initial setup

-- Enable UUID extension for generating UUIDs
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enable pgcrypto extension for password hashing if needed
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create schema (will be handled by Prisma later)
-- Initial setup completed