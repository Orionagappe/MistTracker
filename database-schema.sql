-- MistTracker Database Schema
-- Run this script to initialize all required tables

-- Create database
CREATE DATABASE IF NOT EXISTS mist;
USE mist;

-- Timeline table (PrimaryLine)
CREATE TABLE IF NOT EXISTS PrimaryLine (
  id INT AUTO_INCREMENT PRIMARY KEY,
  value TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Categories associated with timelines
CREATE TABLE IF NOT EXISTS CategoryLine (
  id INT AUTO_INCREMENT PRIMARY KEY,
  primaryLineId INT NOT NULL,
  category VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (primaryLineId) REFERENCES PrimaryLine(id) ON DELETE CASCADE
);

-- Items in categories
CREATE TABLE IF NOT EXISTS ItemLine (
  id INT AUTO_INCREMENT PRIMARY KEY,
  categoryLineId INT NOT NULL,
  itemValue TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (categoryLineId) REFERENCES CategoryLine(id) ON DELETE CASCADE
);

-- Builder configuration per timeline
CREATE TABLE IF NOT EXISTS builder_configs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  timeline_id INT NOT NULL,
  config JSON NOT NULL COMMENT 'Serialized builder configuration (atoms, emitters, settings)',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (timeline_id) REFERENCES PrimaryLine(id) ON DELETE CASCADE,
  UNIQUE KEY unique_timeline_config (timeline_id)
);

-- User milestones tracking (if needed for Phase 8)
CREATE TABLE IF NOT EXISTS user_milestones (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  milestone_data JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY unique_user_milestone (user_id)
);

-- Create indices for common queries
CREATE INDEX idx_timeline_builder_config ON builder_configs(timeline_id);
CREATE INDEX idx_category_timeline ON CategoryLine(primaryLineId);
CREATE INDEX idx_item_category ON ItemLine(categoryLineId);
CREATE INDEX idx_user_milestone ON user_milestones(user_id);

-- Display initialization summary
SELECT 'Database schema initialized successfully' as status;
