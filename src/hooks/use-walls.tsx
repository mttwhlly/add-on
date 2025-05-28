// src/hooks/use-walls.tsx
import { supabase } from '@/lib/supabase';
import { useState } from 'react';
import { useAuth } from './use-auth';

export interface ClimbingWall {
  id: string;
  created_by_user_id: string;
  name: string;
  location: string;
  description?: string;
  photo_url: string;
  photo_path: string;
  is_public: boolean;
  created_at: string;
  updated_at: string;
  route_count?: number;
}

export interface WallHold {
  id: string;
  wall_id: string;
  x_percentage: number;
  y_percentage: number;
  description: string;
  color?: string;
  hold_type?: 'jug' | 'crimp' | 'pinch' | 'sloper' | 'pocket' | 'other';
  created_at: string;
}

export interface ClimbingRoute {
  id: string;
  wall_id: string;
  created_by_user_id: string;
  name: string;
  grade?: string;
  description?: string;
  is_public: boolean;
  created_at: string;
  updated_at: string;
}

export interface RouteHold {
  id: string;
  route_id: string;
  hold_id: string;
  sequence_order: number;
  hold_role: 'start' | 'middle' | 'finish' | 'feet_only';
  created_at: string;
  hold?: WallHold; // Joined hold data
}

export interface CreateWallData {
  name: string;
  location: string;
  description?: string;
  photo_url: string;
  photo_path: string;
  is_public?: boolean;
}

export interface CreateRouteData {
  wall_id: string;
  name: string;
  grade?: string;
  description?: string;
  hold_sequence: Array<{
    hold_id: string;
    hold_role: 'start' | 'middle' | 'finish' | 'feet_only';
  }>;
  is_public?: boolean;
}

export const useWalls = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ==========================================
  // WALL MANAGEMENT
  // ==========================================

  const createWall = async (wallData: CreateWallData): Promise<ClimbingWall | null> => {
    if (!user) return null;
    
    setLoading(true);
    setError(null);
    
    try {
      const { data, error } = await supabase
        .from('climbing_walls')
        .insert([
          {
            created_by_user_id: user.id,
            ...wallData,
            is_public: wallData.is_public ?? true,
          },
        ])
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (err: any) {
      console.error('Error creating wall:', err);
      setError(err.message);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const getWalls = async (location?: string, limit: number = 50): Promise<ClimbingWall[]> => {
    setLoading(true);
    setError(null);
    
    try {
      const { data, error } = await supabase.rpc('get_nearby_walls', {
        search_location: location || null,
        limit_count: limit,
      });

      if (error) throw error;
      return data || [];
    } catch (err: any) {
      console.error('Error fetching walls:', err);
      setError(err.message);
      return [];
    } finally {
      setLoading(false);
    }
  };

  const getWallById = async (wallId: string): Promise<ClimbingWall | null> => {
    setLoading(true);
    setError(null);
    
    try {
      const { data, error } = await supabase
        .from('climbing_walls')
        .select('*')
        .eq('id', wallId)
        .single();

      if (error) throw error;
      return data;
    } catch (err: any) {
      console.error('Error fetching wall:', err);
      setError(err.message);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const getUserWalls = async (): Promise<ClimbingWall[]> => {
    if (!user) return [];
    
    setLoading(true);
    setError(null);
    
    try {
      const { data, error } = await supabase
        .from('climbing_walls')
        .select(`
          *,
          climbing_routes!inner(id)
        `)
        .eq('created_by_user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Add route count
      return (data || []).map(wall => ({
        ...wall,
        route_count: wall.climbing_routes?.length || 0,
      }));
    } catch (err: any) {
      console.error('Error fetching user walls:', err);
      setError(err.message);
      return [];
    } finally {
      setLoading(false);
    }
  };

  // ==========================================
  // HOLDS MANAGEMENT
  // ==========================================

  const addHoldsToWall = async (wallId: string, holds: Omit<WallHold, 'id' | 'wall_id' | 'created_at'>[]): Promise<boolean> => {
    setLoading(true);
    setError(null);
    
    try {
      const holdsData = holds.map(hold => ({
        wall_id: wallId,
        ...hold,
      }));

      const { error } = await supabase
        .from('wall_holds')
        .insert(holdsData);

      if (error) throw error;
      return true;
    } catch (err: any) {
      console.error('Error adding holds:', err);
      setError(err.message);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const getWallHolds = async (wallId: string): Promise<WallHold[]> => {
    setLoading(true);
    setError(null);
    
    try {
      const { data, error } = await supabase
        .from('wall_holds')
        .select('*')
        .eq('wall_id', wallId)
        .order('created_at');

      if (error) throw error;
      return data || [];
    } catch (err: any) {
      console.error('Error fetching holds:', err);
      setError(err.message);
      return [];
    } finally {
      setLoading(false);
    }
  };

  const deleteHold = async (holdId: string): Promise<boolean> => {
    setLoading(true);
    setError(null);
    
    try {
      const { error } = await supabase
        .from('wall_holds')
        .delete()
        .eq('id', holdId);

      if (error) throw error;
      return true;
    } catch (err: any) {
      console.error('Error deleting hold:', err);
      setError(err.message);
      return false;
    } finally {
      setLoading(false);
    }
  };

  // ==========================================
  // ROUTE MANAGEMENT
  // ==========================================

  const createRoute = async (routeData: CreateRouteData): Promise<ClimbingRoute | null> => {
    if (!user) return null;
    
    setLoading(true);
    setError(null);
    
    try {
      // Create the route
      const { data: route, error: routeError } = await supabase
        .from('climbing_routes')
        .insert([
          {
            created_by_user_id: user.id,
            wall_id: routeData.wall_id,
            name: routeData.name,
            grade: routeData.grade,
            description: routeData.description,
            is_public: routeData.is_public ?? true,
          },
        ])
        .select()
        .single();

      if (routeError) throw routeError;

      // Add route holds if provided
      if (routeData.hold_sequence.length > 0) {
        const routeHoldsData = routeData.hold_sequence.map((holdSeq, index) => ({
          route_id: route.id,
          hold_id: holdSeq.hold_id,
          sequence_order: index + 1,
          hold_role: holdSeq.hold_role,
        }));

        const { error: holdsError } = await supabase
          .from('route_holds')
          .insert(routeHoldsData);

        if (holdsError) {
          console.error('Error adding route holds:', holdsError);
          // Don't fail the whole operation
        }
      }

      return route;
    } catch (err: any) {
      console.error('Error creating route:', err);
      setError(err.message);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const getRouteWithHolds = async (routeId: string): Promise<any> => {
    setLoading(true);
    setError(null);
    
    try {
      const { data, error } = await supabase.rpc('get_route_with_holds', {
        route_uuid: routeId,
      });

      if (error) throw error;
      return data;
    } catch (err: any) {
      console.error('Error fetching route with holds:', err);
      setError(err.message);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const getWallRoutes = async (wallId: string): Promise<ClimbingRoute[]> => {
    setLoading(true);
    setError(null);
    
    try {
      const { data, error } = await supabase
        .from('climbing_routes')
        .select('*')
        .eq('wall_id', wallId)
        .eq('is_public', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (err: any) {
      console.error('Error fetching wall routes:', err);
      setError(err.message);
      return [];
    } finally {
      setLoading(false);
    }
  };

  const getUserRoutes = async (): Promise<ClimbingRoute[]> => {
    if (!user) return [];
    
    setLoading(true);
    setError(null);
    
    try {
      const { data, error } = await supabase
        .from('climbing_routes')
        .select(`
          *,
          climbing_walls!inner(name, location)
        `)
        .eq('created_by_user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (err: any) {
      console.error('Error fetching user routes:', err);
      setError(err.message);
      return [];
    } finally {
      setLoading(false);
    }
  };

  // ==========================================
  // SEARCH & DISCOVERY
  // ==========================================

  const searchWalls = async (query: string): Promise<ClimbingWall[]> => {
    setLoading(true);
    setError(null);
    
    try {
      const { data, error } = await supabase
        .from('climbing_walls')
        .select('*')
        .or(`name.ilike.%${query}%,location.ilike.%${query}%,description.ilike.%${query}%`)
        .eq('is_public', true)
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      return data || [];
    } catch (err: any) {
      console.error('Error searching walls:', err);
      setError(err.message);
      return [];
    } finally {
      setLoading(false);
    }
  };

  const searchRoutes = async (query: string): Promise<ClimbingRoute[]> => {
    setLoading(true);
    setError(null);
    
    try {
      const { data, error } = await supabase
        .from('climbing_routes')
        .select(`
          *,
          climbing_walls!inner(name, location)
        `)
        .or(`name.ilike.%${query}%,description.ilike.%${query}%,grade.ilike.%${query}%`)
        .eq('is_public', true)
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      return data || [];
    } catch (err: any) {
      console.error('Error searching routes:', err);
      setError(err.message);
      return [];
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    error,
    // Wall management
    createWall,
    getWalls,
    getWallById,
    getUserWalls,
    // Holds management
    addHoldsToWall,
    getWallHolds,
    deleteHold,
    // Route management
    createRoute,
    getRouteWithHolds,
    getWallRoutes,
    getUserRoutes,
    // Search
    searchWalls,
    searchRoutes,
  };
};