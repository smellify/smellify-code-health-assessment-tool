// services/githubCloneService.js
const { exec } = require('child_process');
const fs = require('fs').promises;
const path = require('path');
const Project = require('../models/repository');
const GitHubAuth = require('../models/GitHubAuth');

class GitHubCloneService {
  constructor() {
    this.cloneDir = path.join(__dirname, '../cloned-repos');
    this.ensureCloneDirectory();
  }

  async ensureCloneDirectory() {
    try {
      await fs.access(this.cloneDir);
    } catch (error) {
      await fs.mkdir(this.cloneDir, { recursive: true });
    }
  }

  async cloneRepository(projectId) {
    try {
      const project = await Project.findById(projectId);
      if (!project || project.source !== 'github') {
        throw new Error('Invalid project or not a GitHub project');
      }

      const githubAuth = await GitHubAuth.findOne({ user: project.user });
      if (!githubAuth) {
        throw new Error('GitHub authentication not found');
      }

      // Update project status
      project.analysisStatus = 'processing';
      await project.save();

      // Create project-specific directory
      const projectDir = path.join(this.cloneDir, project._id.toString());
      await fs.mkdir(projectDir, { recursive: true });

      // Clone the repository
      const cloneUrl = project.githubInfo.cloneUrl.replace(
        'https://github.com/',
        `https://${githubAuth.accessToken}@github.com/`
      );

      await this.executeCommand(
        `git clone --depth 1 ${cloneUrl} ${projectDir}`,
        { cwd: this.cloneDir }
      );

      // Update project with local path
      project.localPath = projectDir;
      project.githubInfo.lastSynced = new Date();
      await project.save();

      console.log(`Repository cloned successfully: ${project.githubInfo.repositoryFullName}`);
      
      // Trigger analysis (you can implement this based on your analysis logic)
      await this.analyzeProject(project);

    } catch (error) {
      console.error(`Error cloning repository for project ${projectId}:`, error);
      
      // Update project status to failed
      await Project.findByIdAndUpdate(projectId, {
        analysisStatus: 'failed',
        errorMessage: error.message
      });
      
      throw error;
    }
  }

  async analyzeProject(project) {
    try {
      const projectPath = project.localPath;
      
      // Basic analysis - you can expand this based on your requirements
      const analysis = {
        files: await this.getProjectFiles(projectPath),
        packageJson: await this.getPackageInfo(projectPath),
        metrics: await this.calculateBasicMetrics(projectPath),
        codeSmells: [] // Implement your code smell detection logic here
      };

      // Update project with analysis results
      project.analysisReport = {
        ...analysis,
        generatedAt: new Date()
      };
      project.analysisStatus = 'completed';
      await project.save();

      console.log(`Analysis completed for project: ${project.projectName}`);

    } catch (error) {
      console.error(`Error analyzing project ${project._id}:`, error);
      
      project.analysisStatus = 'failed';
      project.errorMessage = error.message;
      await project.save();
      
      throw error;
    }
  }

  async getProjectFiles(projectPath) {
    try {
      const files = [];
      const entries = await fs.readdir(projectPath, { withFileTypes: true });
      
      for (const entry of entries) {
        if (entry.isFile() && this.isRelevantFile(entry.name)) {
          const filePath = path.join(projectPath, entry.name);
          const stats = await fs.stat(filePath);
          files.push({
            name: entry.name,
            path: filePath,
            size: stats.size,
            extension: path.extname(entry.name)
          });
        } else if (entry.isDirectory() && !entry.name.startsWith('.') && entry.name !== 'node_modules') {
          const subFiles = await this.getProjectFiles(path.join(projectPath, entry.name));
          files.push(...subFiles);
        }
      }
      
      return files;
    } catch (error) {
      console.error('Error getting project files:', error);
      return [];
    }
  }

  async getPackageInfo(projectPath) {
    try {
      const packageJsonPath = path.join(projectPath, 'package.json');
      const packageContent = await fs.readFile(packageJsonPath, 'utf8');
      return JSON.parse(packageContent);
    } catch (error) {
      console.log('No package.json found or error reading it');
      return null;
    }
  }

  async calculateBasicMetrics(projectPath) {
    try {
      const files = await this.getProjectFiles(projectPath);
      const jsFiles = files.filter(f => ['.js', '.jsx', '.ts', '.tsx'].includes(f.extension));
      
      let totalLines = 0;
      for (const file of jsFiles) {
        try {
          const content = await fs.readFile(file.path, 'utf8');
          totalLines += content.split('\n').length;
        } catch (err) {
          console.warn(`Could not read file: ${file.path}`);
        }
      }
      
      return {
        totalFiles: files.length,
        jsFiles: jsFiles.length,
        linesOfCode: totalLines,
        complexity: Math.floor(totalLines / 10), // Simple complexity calculation
        maintainabilityIndex: Math.max(0, 100 - Math.floor(totalLines / 100)) // Simple maintainability index
      };
    } catch (error) {
      console.error('Error calculating metrics:', error);
      return {
        totalFiles: 0,
        jsFiles: 0,
        linesOfCode: 0,
        complexity: 0,
        maintainabilityIndex: 0
      };
    }
  }

  isRelevantFile(filename) {
    const relevantExtensions = ['.js', '.jsx', '.ts', '.tsx', '.json', '.md', '.css', '.scss', '.html'];
    const ext = path.extname(filename).toLowerCase();
    return relevantExtensions.includes(ext);
  }

  async executeCommand(command, options = {}) {
    return new Promise((resolve, reject) => {
      exec(command, options, (error, stdout, stderr) => {
        if (error) {
          reject(new Error(`Command failed: ${error.message}`));
        } else {
          resolve(stdout);
        }
      });
    });
  }

  async cleanupProject(projectId) {
    try {
      const projectDir = path.join(this.cloneDir, projectId.toString());
      await fs.rmdir(projectDir, { recursive: true });
      console.log(`Cleaned up project directory: ${projectId}`);
    } catch (error) {
      console.error(`Error cleaning up project ${projectId}:`, error);
    }
  }
}

// Usage in your route or background job
const githubCloneService = new GitHubCloneService();

// Add this to your GitHub import route after creating the project
// githubCloneService.cloneRepository(project._id).catch(console.error);

module.exports = GitHubCloneService;