CREATE DATABASE IF NOT EXISTS quiz_db;
USE quiz_db;

CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role ENUM('user', 'staff', 'admin') DEFAULT 'user',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS quizzes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    code VARCHAR(10) NOT NULL UNIQUE,
    answer_mode ENUM('instant', 'after_submit', 'hidden') DEFAULT 'after_submit',
    timer INT DEFAULT 0,
    show_explanation BOOLEAN DEFAULT TRUE,
    allow_review BOOLEAN DEFAULT TRUE,
    is_team BOOLEAN DEFAULT FALSE,
    shuffle_questions BOOLEAN DEFAULT FALSE,
    shuffle_options BOOLEAN DEFAULT FALSE,
    negative_marking DECIMAL(5,2) DEFAULT 0.00,
    pass_percentage INT DEFAULT 50,
    quiz_type ENUM('async', 'live', 'scheduled') DEFAULT 'async',
    category VARCHAR(50) DEFAULT 'General',
    thumbnail_url TEXT,
    scheduled_start DATETIME NULL,
    scheduled_end DATETIME NULL,
    is_live BOOLEAN DEFAULT FALSE,
    theme_color VARCHAR(20) DEFAULT '#3b82f6',
    bg_image_url TEXT,
    is_public BOOLEAN DEFAULT FALSE,
    created_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS questions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    quiz_id INT NOT NULL,
    question TEXT NOT NULL,
    option_a TEXT NOT NULL,
    option_b TEXT NOT NULL,
    option_c TEXT NOT NULL,
    option_d TEXT NOT NULL,
    correct_option ENUM('a', 'b', 'c', 'd') NOT NULL,
    explanation TEXT,
    type ENUM('mcq', 'short', 'tf') DEFAULT 'mcq',
    points INT DEFAULT 1,
    image_url TEXT,
    FOREIGN KEY (quiz_id) REFERENCES quizzes(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS attempts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    quiz_id INT NOT NULL,
    score DECIMAL(10, 2) DEFAULT 0,
    time_taken INT DEFAULT 0,
    tab_switches INT DEFAULT 0,
    status ENUM('active', 'blocked', 'completed') DEFAULT 'active',
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (quiz_id) REFERENCES quizzes(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS answers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    attempt_id INT NOT NULL,
    question_id INT NOT NULL,
    selected_option ENUM('a', 'b', 'c', 'd'),
    is_correct BOOLEAN,
    FOREIGN KEY (attempt_id) REFERENCES attempts(id) ON DELETE CASCADE,
    FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE
);
