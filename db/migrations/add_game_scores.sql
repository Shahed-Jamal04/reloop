-- Create GameScores table for storing user game scores
CREATE TABLE GameScores (
  id INT PRIMARY KEY IDENTITY(1,1),
  userId INT NOT NULL,
  gameName VARCHAR(100) NOT NULL,
  score INT NOT NULL,
  timeSpent INT,
  createdAt DATETIME DEFAULT GETDATE(),
  FOREIGN KEY (userId) REFERENCES Users(id) ON DELETE CASCADE,
  INDEX idx_userId (userId),
  INDEX idx_gameName (gameName),
  INDEX idx_createdAt (createdAt)
);

-- Create UserAchievements table for badges
CREATE TABLE UserAchievements (
  id INT PRIMARY KEY IDENTITY(1,1),
  userId INT NOT NULL,
  achievementType VARCHAR(100) NOT NULL,
  achievementName VARCHAR(255),
  badge VARCHAR(50),
  earnedAt DATETIME DEFAULT GETDATE(),
  FOREIGN KEY (userId) REFERENCES Users(id) ON DELETE CASCADE,
  INDEX idx_userId (userId),
  INDEX idx_achievementType (achievementType),
  UNIQUE (userId, achievementType)
);
