'use client';

import { useState, useCallback, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';

import { CreatePostSchema, UpdatePostSchema, type CreatePostInput, type UpdatePostInput } from '@/schemas/post';
import { PostWithDetails } from '@/types/database';
import { useApiCall } from './useApiCall';

export interface UsePostFormOptions {
  mode: 'create' | 'edit';
  post?: PostWithDetails;
  onSuccess?: (post: PostWithDetails) => void;
  onCancel?: () => void;
  autoSave?: boolean;
  autoSaveDelay?: number;
}

export interface UsePostFormReturn {
  // Form methods
  form: ReturnType<typeof useForm<CreatePostInput | UpdatePostInput>>;
  
  // Form state
  isSubmitting: boolean;
  submitError: string | null;
  isDirty: boolean;
  isValid: boolean;
  
  // Auto-save state
  isAutoSaving: boolean;
  lastSaved: Date | null;
  
  // Actions
  handleSubmit: () => Promise<void>;
  handleCancel: () => void;
  clearError: () => void;
  saveDraft: () => Promise<void>;
  
  // Preview
  previewData: CreatePostInput | UpdatePostInput | null;
}

const DRAFT_STORAGE_KEY = 'tutorconnect-post-draft';
const AUTO_SAVE_DELAY = 2000; // 2 seconds

export function usePostForm(options: UsePostFormOptions): UsePostFormReturn {
  const {
    mode,
    post,
    onSuccess,
    onCancel,
    autoSave = false,
    autoSaveDelay = AUTO_SAVE_DELAY
  } = options;

  const router = useRouter();
  const { apiCall } = useApiCall();
  
  // State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isAutoSaving, setIsAutoSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  // Form setup
  const schema = mode === 'create' ? CreatePostSchema : UpdatePostSchema;
  const form = useForm<CreatePostInput | UpdatePostInput>({
    resolver: zodResolver(schema),
    defaultValues: getDefaultValues(),
    mode: 'onChange'
  });

  const { watch, reset, formState: { isDirty, isValid } } = form;
  const watchedValues = watch();

  // Get default values based on mode and post data
  function getDefaultValues(): Partial<CreatePostInput | UpdatePostInput> {
    if (mode === 'edit' && post) {
      return {
        type: post.type,
        subject: post.subject,
        ageGroups: post.ageGroups,
        title: post.title,
        description: post.description,
        availableDays: post.availableDays,
        availableTimes: post.availableTimes,
        preferredSchedule: post.preferredSchedule || undefined,
        location: post.location,
        specificLocation: post.specificLocation || undefined,
        hourlyRate: post.hourlyRate ? Number(post.hourlyRate) : undefined,
        hourlyRateMin: post.hourlyRateMin ? Number(post.hourlyRateMin) : undefined,
        hourlyRateMax: post.hourlyRateMax ? Number(post.hourlyRateMax) : undefined,
      };
    }
    
    // Check for draft in localStorage for create mode
    if (mode === 'create') {
      try {
        const draft = localStorage.getItem(DRAFT_STORAGE_KEY);
        if (draft) {
          const parsedDraft = JSON.parse(draft);
          if (parsedDraft.timestamp && Date.now() - parsedDraft.timestamp < 24 * 60 * 60 * 1000) { // 24 hours
            return parsedDraft.data;
          } else {
            localStorage.removeItem(DRAFT_STORAGE_KEY);
          }
        }
      } catch (error) {
        console.warn('Failed to restore draft:', error);
      }
    }
    
    return {
      type: 'TUTOR_OFFERING',
      ageGroups: [],
      availableDays: [],
      availableTimes: ['09:00'],
    };
  }

  // Save draft to localStorage
  const saveDraft = useCallback(async () => {
    if (mode === 'edit' || !isDirty) return;
    
    try {
      setIsAutoSaving(true);
      const draft = {
        data: watchedValues,
        timestamp: Date.now(),
      };
      localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(draft));
      setLastSaved(new Date());
    } catch (error) {
      console.warn('Failed to save draft:', error);
    } finally {
      setIsAutoSaving(false);
    }
  }, [mode, isDirty, watchedValues]);

  // Auto-save effect
  useEffect(() => {
    if (!autoSave || mode === 'edit') return;

    const timeoutId = setTimeout(() => {
      if (isDirty) {
        saveDraft();
      }
    }, autoSaveDelay);

    return () => clearTimeout(timeoutId);
  }, [watchedValues, autoSave, autoSaveDelay, isDirty, saveDraft, mode]);

  // Form submission handler
  const handleSubmit = useCallback(async () => {
    const isFormValid = await form.trigger();
    if (!isFormValid) return;

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const formData = form.getValues();
      const endpoint = mode === 'create' ? '/api/posts' : `/api/posts/${post!.id}`;
      const method = mode === 'create' ? 'POST' : 'PUT';

      const response = await apiCall<PostWithDetails>({
        method,
        endpoint,
        data: formData,
      });

      if (response.success && response.data) {
        // Clear draft on successful creation
        if (mode === 'create') {
          localStorage.removeItem(DRAFT_STORAGE_KEY);
        }
        
        onSuccess?.(response.data);
      } else {
        throw new Error(response.error || `Failed to ${mode} post`);
      }
    } catch (error) {
      console.error(`Error ${mode === 'create' ? 'creating' : 'updating'} post:`, error);
      setSubmitError(error instanceof Error ? error.message : 'An error occurred');
    } finally {
      setIsSubmitting(false);
    }
  }, [form, mode, post, apiCall, onSuccess]);

  // Cancel handler
  const handleCancel = useCallback(() => {
    if (onCancel) {
      onCancel();
    } else {
      router.back();
    }
  }, [onCancel, router]);

  // Clear error
  const clearError = useCallback(() => {
    setSubmitError(null);
  }, []);

  // Clear draft when component unmounts
  useEffect(() => {
    return () => {
      // Don't clear on unmount, let the user decide when to clear
    };
  }, []);

  return {
    form,
    isSubmitting,
    submitError,
    isDirty,
    isValid,
    isAutoSaving,
    lastSaved,
    handleSubmit,
    handleCancel,
    clearError,
    saveDraft,
    previewData: watchedValues as CreatePostInput | UpdatePostInput,
  };
}

// Utility function to clear draft
export function clearPostDraft() {
  try {
    localStorage.removeItem(DRAFT_STORAGE_KEY);
  } catch (error) {
    console.warn('Failed to clear draft:', error);
  }
}

// Utility function to check if draft exists
export function hasPostDraft(): boolean {
  try {
    const draft = localStorage.getItem(DRAFT_STORAGE_KEY);
    if (draft) {
      const parsedDraft = JSON.parse(draft);
      return parsedDraft.timestamp && Date.now() - parsedDraft.timestamp < 24 * 60 * 60 * 1000;
    }
  } catch (error) {
    console.warn('Failed to check for draft:', error);
  }
  return false;
}