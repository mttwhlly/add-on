// src/hooks/use-walls.jsx (updated for PocketBase)
import { useState } from 'react';
import { pb } from '@/lib/pocketbase';
import { useAuth } from './use-auth';

export interface ClimbingProblem {
  id: string;
  creator: string;
  name: string;
  location: string;
  description?: string;
  difficulty?: string;
  wall_photo: string;
  holds: any[]; // JSON array of holds
  is_public: boolean;
  tags?: any[]; // JSON array of tags
  created: string;
  updated: string;
}

export interface Hold {
  id: string;
  x: number;
  y: number;
  description: string;
  color?: string;
  type?: 'start' | 'middle' | 'finish' | 'feet_only';
}

export interface CreateProblemData {
  name: string;
  location: string;
  description?: string;
  difficulty?: string;
  wall_photo: File | Blob;
  holds: Hold[];
  is_public?: boolean;
  tags?: string[];
}

export const useWalls = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ==========================================
  // CLIMBING PROBLEMS MANAGEMENT
  // ==========================================

  const createProblem = async (problemData: CreateProblemData): Promise<ClimbingProblem | null> => {
    if (!user) return null;
    
    setLoading(true);
    setError(null);
    
    try {
      console.log('PocketBase: Creating climbing problem...', problemData.name);
      
      // Create FormData for file upload
      const formData = new FormData();
      formData.append('creator', user.id);
      formData.append('name', problemData.name);
      formData.append('location', problemData.location);
      formData.append('description', problemData.description || '');
      formData.append('difficulty', problemData.difficulty || '');
      formData.append('holds', JSON.stringify(problemData.holds));
      formData.append('is_public', problemData.is_public !== false ? 'true' : 'false');
      formData.append('tags', JSON.stringify(problemData.tags || []));
      formData.append('wall_photo', problemData.wall_photo);

      const problem = await pb.pb.collection('climbing_problems').create(formData);
      
      console.log('PocketBase: Problem created successfully:', problem.id);
      return problem;
    } catch (err: any) {
      console.error('PocketBase: Error creating problem:', err);
      setError(err.message);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const getProblems = async (location?: string, limit: number = 50): Promise<ClimbingProblem[]> => {
    setLoading(true);
    setError(null);
    
    try {
      console.log('PocketBase: Fetching problems...', { location, limit });
      
      let filter = 'is_public = true';
      if (location) {
        filter += ` && location ~ "${location}"`;
      }

      const result = await pb.pb.collection('climbing_problems').getList(1, limit, {
        filter,
        sort: '-created',
        expand: 'creator'
      });

      console.log('PocketBase: Found problems:', result.items.length);
      return result.items;
    } catch (err: any) {
      console.error('PocketBase: Error fetching problems:', err);
      setError(err.message);
      return [];
    } finally {
      setLoading(false);
    }
  };

  const getProblemById = async (problemId: string): Promise<ClimbingProblem | null> => {
    setLoading(true);
    setError(null);
    
    try {
      console.log('PocketBase: Fetching problem by ID:', problemId);
      
      const problem = await pb.pb.collection('climbing_problems').getOne(problemId, {
        expand: 'creator'
      });

      console.log('PocketBase: Problem found:', problem.name);
      return problem;
    } catch (err: any) {
      console.error('PocketBase: Error fetching problem:', err);
      setError(err.message);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const getUserProblems = async (): Promise<ClimbingProblem[]> => {
    if (!user) return [];
    
    setLoading(true);
    setError(null);
    
    try {
      console.log('PocketBase: Fetching user problems...');
      
      const result = await pb.pb.collection('climbing_problems').getList(1, 50, {
        filter: `creator = "${user.id}"`,
        sort: '-created'
      });

      console.log('PocketBase: Found user problems:', result.items.length);
      return result.items;
    } catch (err: any) {
      console.error('PocketBase: Error fetching user problems:', err);
      setError(err.message);
      return [];
    } finally {
      setLoading(false);
    }
  };

  const updateProblem = async (problemId: string, updates: Partial<CreateProblemData>): Promise<ClimbingProblem | null> => {
    if (!user) return null;
    
    setLoading(true);
    setError(null);
    
    try {
      console.log('PocketBase: Updating problem:', problemId);
      
      // Prepare update data
      const updateData: any = {};
      
      if (updates.name) updateData.name = updates.name;
      if (updates.location) updateData.location = updates.location;
      if (updates.description !== undefined) updateData.description = updates.description;
      if (updates.difficulty !== undefined) updateData.difficulty = updates.difficulty;
      if (updates.holds) updateData.holds = JSON.stringify(updates.holds);
      if (updates.is_public !== undefined) updateData.is_public = updates.is_public;
      if (updates.tags) updateData.tags = JSON.stringify(updates.tags);

      // Handle file upload if new photo
      if (updates.wall_photo) {
        const formData = new FormData();
        Object.keys(updateData).forEach(key => {
          formData.append(key, updateData[key]);
        });
        formData.append('wall_photo', updates.wall_photo);
        
        const problem = await pb.pb.collection('climbing_problems').update(problemId, formData);
        return problem;
      } else {
        const problem = await pb.pb.collection('climbing_problems').update(problemId, updateData);
        return problem;
      }
    } catch (err: any) {
      console.error('PocketBase: Error updating problem:', err);
      setError(err.message);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const deleteProblem = async (problemId: string): Promise<boolean> => {
    if (!user) return false;
    
    setLoading(true);
    setError(null);
    
    try {
      console.log('PocketBase: Deleting problem:', problemId);
      
      await pb.pb.collection('climbing_problems').delete(problemId);
      
      console.log('PocketBase: Problem deleted successfully');
      return true;
    } catch (err: any) {
      console.error('PocketBase: Error deleting problem:', err);
      setError(err.message);
      return false;
    } finally {
      setLoading(false);
    }
  };

  // ==========================================
  // SEARCH & DISCOVERY
  // ==========================================

  const searchProblems = async (query: string): Promise<ClimbingProblem[]> => {
    setLoading(true);
    setError(null);
    
    try {
      console.log('PocketBase: Searching problems:', query);
      
      const result = await pb.pb.collection('climbing_problems').getList(1, 20, {
        filter: `is_public = true && (name ~ "${query}" || location ~ "${query}" || description ~ "${query}" || difficulty ~ "${query}")`,
        sort: '-created',
        expand: 'creator'
      });

      console.log('PocketBase: Search results:', result.items.length);
      return result.items;
    } catch (err: any) {
      console.error('PocketBase: Error searching problems:', err);
      setError(err.message);
      return [];
    } finally {
      setLoading(false);
    }
  };

  const getProblemsByDifficulty = async (difficulty: string): Promise<ClimbingProblem[]> => {
    setLoading(true);
    setError(null);
    
    try {
      console.log('PocketBase: Fetching problems by difficulty:', difficulty);
      
      const result = await pb.pb.collection('climbing_problems').getList(1, 50, {
        filter: `is_public = true && difficulty = "${difficulty}"`,
        sort: '-created',
        expand: 'creator'
      });

      return result.items;
    } catch (err: any) {
      console.error('PocketBase: Error fetching problems by difficulty:', err);
      setError(err.message);
      return [];
    } finally {
      setLoading(false);
    }
  };

  const getProblemsByLocation = async (location: string): Promise<ClimbingProblem[]> => {
    setLoading(true);
    setError(null);
    
    try {
      console.log('PocketBase: Fetching problems by location:', location);
      
      const result = await pb.pb.collection('climbing_problems').getList(1, 50, {
        filter: `is_public = true && location ~ "${location}"`,
        sort: '-created',
        expand: 'creator'
      });

      return result.items;
    } catch (err: any) {
      console.error('PocketBase: Error fetching problems by location:', err);
      setError(err.message);
      return [];
    } finally {
      setLoading(false);
    }
  };

  // ==========================================
  // UTILITY FUNCTIONS
  // ==========================================

  const getPhotoUrl = (problem: ClimbingProblem): string => {
    return pb.pb.getFileUrl(problem, problem.wall_photo);
  };

  const getCreatorInfo = async (creatorId: string) => {
    try {
      const creator = await pb.pb.collection('users').getOne(creatorId);
      return {
        username: creator.username,
        email: creator.email
      };
    } catch (error) {
      console.error('Error fetching creator info:', error);
      return null;
    }
  };

  return {
    loading,
    error,
    // Problem management
    createProblem,
    getProblems,
    getProblemById,
    getUserProblems,
    updateProblem,
    deleteProblem,
    // Search & discovery
    searchProblems,
    getProblemsByDifficulty,
    getProblemsByLocation,
    // Utility
    getPhotoUrl,
    getCreatorInfo,
  };
};