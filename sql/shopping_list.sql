-- Shopping List table
CREATE TABLE IF NOT EXISTS shopping_lists (
  id BIGSERIAL PRIMARY KEY,
  user_id TEXT NOT NULL DEFAULT 'default_user',
  title TEXT NOT NULL,
  category TEXT NOT NULL,
  is_completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_shopping_lists_user_id ON shopping_lists(user_id);
CREATE INDEX IF NOT EXISTS idx_shopping_lists_category ON shopping_lists(category);
CREATE INDEX IF NOT EXISTS idx_shopping_lists_is_completed ON shopping_lists(is_completed);

-- Weekly Tasks table
CREATE TABLE IF NOT EXISTS weekly_tasks (
  id BIGSERIAL PRIMARY KEY,
  user_id TEXT NOT NULL DEFAULT 'default_user',
  goal_id UUID NOT NULL,
  week_number INTEGER,
  month DATE,
  category TEXT,
  allocated_minutes INTEGER,
  actual_minutes INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_weekly_tasks_user_id ON weekly_tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_weekly_tasks_goal_id ON weekly_tasks(goal_id);
CREATE INDEX IF NOT EXISTS idx_weekly_tasks_month ON weekly_tasks(month);

-- Weekly Subtasks table
CREATE TABLE IF NOT EXISTS weekly_subtasks (
  id BIGSERIAL PRIMARY KEY,
  weekly_task_id BIGINT NOT NULL REFERENCES weekly_tasks(id) ON DELETE CASCADE,
  name TEXT,
  estimated_minutes INTEGER,
  actual_minutes INTEGER DEFAULT 0,
  completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_weekly_subtasks_weekly_task_id ON weekly_subtasks(weekly_task_id);

-- Extend goals table with OKR fields
ALTER TABLE goals ADD COLUMN IF NOT EXISTS breakdown_config JSONB;
ALTER TABLE goals ADD COLUMN IF NOT EXISTS decomposed_at TIMESTAMP;

-- Extend focus_sessions with subtask linkage
ALTER TABLE focus_sessions ADD COLUMN IF NOT EXISTS linked_subtask_id BIGINT;
ALTER TABLE focus_sessions ADD COLUMN IF NOT EXISTS linked_weekly_task_id BIGINT;
