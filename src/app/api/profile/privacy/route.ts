import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { authMiddleware, type AuthenticatedRequest, getAuthenticatedUser } from '@/middleware/auth';
import { updatePrivacySettingsSchema, type UpdatePrivacySettingsInput } from '@/schemas/profile';
import { 
  APIError, 
  ValidationError,
  handleZodError,
  createErrorResponse 
} from '@/lib/errors';
import { PrivacySetting } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * GET /api/profile/privacy - Get current privacy settings
 */
export async function GET(request: NextRequest) {
  try {
    // Authenticate user
    await authMiddleware(request);
    const user = getAuthenticatedUser(request as AuthenticatedRequest);
    
    // Get current privacy settings
    const privacySettings = await prisma.user.findUnique({
      where: { id: user.id },
      select: {
        privacyGender: true,
        privacyAge: true,
        privacyDocuments: true,
        privacyContact: true,
      }
    });

    if (!privacySettings) {
      throw new APIError('User not found', 404, 'USER_NOT_FOUND');
    }

    // Get statistics about privacy settings impact
    const privacyStats = await getPrivacySettingsStats(user.id, privacySettings);

    return NextResponse.json({
      success: true,
      data: {
        ...privacySettings,
        stats: privacyStats,
        availableSettings: {
          PUBLIC: 'Visible to everyone',
          ON_REQUEST: 'Visible when someone requests access',
          PRIVATE: 'Only visible to you',
        },
        recommendations: getPrivacyRecommendations(privacySettings),
      },
      meta: {
        timestamp: new Date().toISOString(),
      }
    });

  } catch (error) {
    console.error('Privacy settings GET error:', error);
    
    if (error instanceof APIError) {
      return NextResponse.json(
        createErrorResponse(error, 'en'),
        { status: error.statusCode }
      );
    }

    return NextResponse.json(
      createErrorResponse(new Error('Failed to fetch privacy settings'), 'en'),
      { status: 500 }
    );
  }
}

/**
 * PUT /api/profile/privacy - Update privacy settings
 */
export async function PUT(request: NextRequest) {
  try {
    // Authenticate user
    await authMiddleware(request);
    const user = getAuthenticatedUser(request as AuthenticatedRequest);
    
    // Parse and validate request body
    const body = await request.json();
    const validatedData = updatePrivacySettingsSchema.parse(body);

    // Update privacy settings
    const updatedPrivacySettings = await prisma.user.update({
      where: { id: user.id },
      data: {
        ...validatedData,
        updatedAt: new Date(),
      },
      select: {
        privacyGender: true,
        privacyAge: true,
        privacyDocuments: true,
        privacyContact: true,
        updatedAt: true,
      }
    });

    // Log privacy setting change for audit purposes (GDPR compliance)
    await logPrivacySettingChange(user.id, validatedData);

    // Get updated stats
    const privacyStats = await getPrivacySettingsStats(user.id, updatedPrivacySettings);

    return NextResponse.json({
      success: true,
      message: 'Privacy settings updated successfully',
      data: {
        ...updatedPrivacySettings,
        stats: privacyStats,
      },
      meta: {
        timestamp: new Date().toISOString(),
      }
    });

  } catch (error) {
    console.error('Privacy settings PUT error:', error);
    
    if (error instanceof Error && error.name === 'ZodError') {
      const validationError = handleZodError(error);
      return NextResponse.json(
        createErrorResponse(validationError, 'en'),
        { status: validationError.statusCode }
      );
    }
    
    if (error instanceof APIError) {
      return NextResponse.json(
        createErrorResponse(error, 'en'),
        { status: error.statusCode }
      );
    }

    return NextResponse.json(
      createErrorResponse(new Error('Failed to update privacy settings'), 'en'),
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/profile/privacy - Update individual privacy setting
 */
export async function PATCH(request: NextRequest) {
  try {
    // Authenticate user
    await authMiddleware(request);
    const user = getAuthenticatedUser(request as AuthenticatedRequest);
    
    // Parse and validate request body
    const body = await request.json();
    const { field, value } = body;

    // Validate field and value
    const allowedFields = ['privacyGender', 'privacyAge', 'privacyDocuments', 'privacyContact'];
    const allowedValues = Object.values(PrivacySetting);

    if (!allowedFields.includes(field)) {
      throw new ValidationError({
        field: [`Invalid privacy field. Allowed fields: ${allowedFields.join(', ')}`]
      });
    }

    if (!allowedValues.includes(value)) {
      throw new ValidationError({
        value: [`Invalid privacy value. Allowed values: ${allowedValues.join(', ')}`]
      });
    }

    // Update specific privacy setting
    const updateData = { [field]: value, updatedAt: new Date() };
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: updateData,
      select: {
        [field]: true,
        updatedAt: true,
      }
    });

    // Log the change
    await logPrivacySettingChange(user.id, { [field]: value });

    return NextResponse.json({
      success: true,
      message: `${field} privacy setting updated successfully`,
      data: updatedUser,
      meta: {
        timestamp: new Date().toISOString(),
        changedField: field,
        newValue: value,
      }
    });

  } catch (error) {
    console.error('Privacy settings PATCH error:', error);
    
    if (error instanceof APIError) {
      return NextResponse.json(
        createErrorResponse(error, 'en'),
        { status: error.statusCode }
      );
    }

    return NextResponse.json(
      createErrorResponse(new Error('Failed to update privacy setting'), 'en'),
      { status: 500 }
    );
  }
}

/**
 * POST /api/profile/privacy/bulk - Bulk update privacy settings with presets
 */
export async function POST(request: NextRequest) {
  try {
    // Authenticate user
    await authMiddleware(request);
    const user = getAuthenticatedUser(request as AuthenticatedRequest);
    
    // Parse request body
    const body = await request.json();
    const { preset } = body;

    // Define privacy presets
    const presets = {
      public: {
        privacyGender: PrivacySetting.PUBLIC,
        privacyAge: PrivacySetting.PUBLIC,
        privacyDocuments: PrivacySetting.PUBLIC,
        privacyContact: PrivacySetting.ON_REQUEST,
      },
      moderate: {
        privacyGender: PrivacySetting.PUBLIC,
        privacyAge: PrivacySetting.ON_REQUEST,
        privacyDocuments: PrivacySetting.ON_REQUEST,
        privacyContact: PrivacySetting.ON_REQUEST,
      },
      private: {
        privacyGender: PrivacySetting.ON_REQUEST,
        privacyAge: PrivacySetting.PRIVATE,
        privacyDocuments: PrivacySetting.ON_REQUEST,
        privacyContact: PrivacySetting.ON_REQUEST,
      },
      strict: {
        privacyGender: PrivacySetting.PRIVATE,
        privacyAge: PrivacySetting.PRIVATE,
        privacyDocuments: PrivacySetting.PRIVATE,
        privacyContact: PrivacySetting.PRIVATE,
      },
    };

    if (!presets[preset as keyof typeof presets]) {
      throw new ValidationError({
        preset: [`Invalid preset. Available presets: ${Object.keys(presets).join(', ')}`]
      });
    }

    const presetSettings = presets[preset as keyof typeof presets];

    // Update all privacy settings with preset
    const updatedPrivacySettings = await prisma.user.update({
      where: { id: user.id },
      data: {
        ...presetSettings,
        updatedAt: new Date(),
      },
      select: {
        privacyGender: true,
        privacyAge: true,
        privacyDocuments: true,
        privacyContact: true,
        updatedAt: true,
      }
    });

    // Log the bulk change
    await logPrivacySettingChange(user.id, presetSettings, `Applied ${preset} preset`);

    return NextResponse.json({
      success: true,
      message: `Privacy settings updated with ${preset} preset`,
      data: updatedPrivacySettings,
      meta: {
        timestamp: new Date().toISOString(),
        appliedPreset: preset,
      }
    });

  } catch (error) {
    console.error('Privacy settings bulk update error:', error);
    
    if (error instanceof APIError) {
      return NextResponse.json(
        createErrorResponse(error, 'en'),
        { status: error.statusCode }
      );
    }

    return NextResponse.json(
      createErrorResponse(new Error('Failed to apply privacy preset'), 'en'),
      { status: 500 }
    );
  }
}

/**
 * Get privacy settings impact statistics
 */
async function getPrivacySettingsStats(userId: string, privacySettings: any) {
  // Count how many fields are set to each privacy level
  const settingsCounts = {
    PUBLIC: 0,
    ON_REQUEST: 0,
    PRIVATE: 0,
  };

  Object.values(privacySettings).forEach((setting: any) => {
    if (setting && Object.values(PrivacySetting).includes(setting)) {
      settingsCounts[setting as PrivacySetting]++;
    }
  });

  // Calculate approximate profile visibility
  const totalSettings = Object.keys(privacySettings).length;
  const publicFields = settingsCounts.PUBLIC;
  const visibilityPercentage = Math.round((publicFields / totalSettings) * 100);

  // Get count of pending info requests (people wanting to see private info)
  const pendingRequests = await prisma.infoRequest.count({
    where: {
      receiverId: userId,
      status: 'PENDING',
    }
  });

  return {
    visibilityPercentage,
    publicFields: settingsCounts.PUBLIC,
    onRequestFields: settingsCounts.ON_REQUEST,
    privateFields: settingsCounts.PRIVATE,
    pendingInfoRequests: pendingRequests,
  };
}

/**
 * Get privacy recommendations based on current settings
 */
function getPrivacyRecommendations(privacySettings: any): string[] {
  const recommendations: string[] = [];

  // Check for potential issues
  if (privacySettings.privacyContact === PrivacySetting.PUBLIC) {
    recommendations.push(
      'Consider setting contact information to "On Request" to prevent spam and maintain privacy'
    );
  }

  if (privacySettings.privacyAge === PrivacySetting.PUBLIC && 
      privacySettings.privacyGender === PrivacySetting.PUBLIC) {
    recommendations.push(
      'Having both age and gender public may reduce privacy. Consider setting one to "On Request"'
    );
  }

  if (Object.values(privacySettings).every(setting => setting === PrivacySetting.PRIVATE)) {
    recommendations.push(
      'All information is private. This may limit your ability to connect with students or tutors'
    );
  }

  if (Object.values(privacySettings).every(setting => setting === PrivacySetting.PUBLIC)) {
    recommendations.push(
      'All information is public. Consider setting contact info to "On Request" for better privacy'
    );
  }

  return recommendations;
}

/**
 * Log privacy setting changes for audit/GDPR compliance
 */
async function logPrivacySettingChange(
  userId: string, 
  changes: Partial<UpdatePrivacySettingsInput>, 
  note?: string
) {
  try {
    // In a production environment, you might want to store this in a separate audit log table
    // For now, we'll just log to console for debugging
    console.log('Privacy setting change:', {
      userId,
      timestamp: new Date().toISOString(),
      changes,
      note,
    });

    // TODO: Implement proper audit logging to database
    // await prisma.auditLog.create({
    //   data: {
    //     userId,
    //     action: 'PRIVACY_SETTINGS_UPDATE',
    //     details: JSON.stringify(changes),
    //     note,
    //     timestamp: new Date(),
    //   }
    // });
  } catch (error) {
    console.error('Failed to log privacy setting change:', error);
    // Don't throw error as this is not critical to the main operation
  }
}