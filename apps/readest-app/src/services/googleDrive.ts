import { supabase } from '@/utils/supabase';

// Constants
const API_BASE_URL = 'https://www.googleapis.com/drive/v3';
const UPLOAD_API_URL = 'https://www.googleapis.com/upload/drive/v3';
const APP_FOLDER_NAME = 'BookTalk Library';

/**
 * Check if the user_drive_tokens table exists in the database
 * @returns true if the table exists, false otherwise
 */
async function checkTableExists(): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('user_drive_tokens')
      .select('id')
      .limit(1)
      .single();
    
    // If we get a "not found" error for a single row that's fine,
    // it just means the table exists but is empty
    if (error && error.code === 'PGRST116') {
      return true;
    }
    
    // If there's no error or it's a different error, the table exists
    return !error || !error.message.includes('does not exist');
  } catch (error) {
    console.error('Error checking if user_drive_tokens table exists:', error);
    return false;
  }
}

/**
 * Creates a dedicated BookTalk folder in the user's Google Drive
 * @returns The ID of the created folder
 */
export async function createBookTalkFolder(): Promise<string | null> {
  try {
    // First check if the user_drive_tokens table exists
    const tableExists = await checkTableExists();
    if (!tableExists) {
      console.error('The user_drive_tokens table does not exist. Please create it in Supabase dashboard.');
      return null;
    }

    const { data: userData } = await supabase.auth.getUser();
    if (!userData?.user) {
      throw new Error('User not authenticated');
    }

    // Get current tokens
    const { data: tokenData, error: tokenError } = await supabase
      .from('user_drive_tokens')
      .select('*')
      .eq('id', userData.user.id)
      .single();

    if (tokenError || !tokenData) {
      throw new Error('Google Drive tokens not found');
    }

    // Check if we already have a folder
    if (tokenData.drive_folder_id) {
      return tokenData.drive_folder_id;
    }

    // Create folder
    const accessToken = tokenData.access_token;
    
    const response = await fetch(`${API_BASE_URL}/files`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: APP_FOLDER_NAME,
        mimeType: 'application/vnd.google-apps.folder',
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to create folder: ${response.statusText}`);
    }

    const folder = await response.json();
    const folderId = folder.id;

    // Save folder ID to database
    const { error: updateError } = await supabase
      .from('user_drive_tokens')
      .update({ drive_folder_id: folderId })
      .eq('id', userData.user.id);

    if (updateError) {
      console.error('Failed to save folder ID:', updateError);
    }

    return folderId;
  } catch (error) {
    console.error('Error creating BookTalk folder:', error);
    return null;
  }
}

/**
 * Uploads a book file to the user's Google Drive BookTalk folder
 * @param file The file to upload
 * @param filename The name to save the file as
 * @returns The ID of the uploaded file
 */
export async function uploadBookFile(
  file: File | Blob,
  filename: string
): Promise<string | null> {
  try {
    // First check if the user_drive_tokens table exists
    const tableExists = await checkTableExists();
    if (!tableExists) {
      console.error('The user_drive_tokens table does not exist. Please create it in Supabase dashboard.');
      return null;
    }

    const { data: userData } = await supabase.auth.getUser();
    if (!userData?.user) {
      throw new Error('User not authenticated');
    }

    // Get current tokens and folder ID
    const { data: tokenData, error: tokenError } = await supabase
      .from('user_drive_tokens')
      .select('*')
      .eq('id', userData.user.id)
      .single();

    if (tokenError || !tokenData) {
      throw new Error('Google Drive tokens not found');
    }

    // Ensure we have a folder
    const folderId = tokenData.drive_folder_id || await createBookTalkFolder();
    if (!folderId) {
      throw new Error('Failed to create or get BookTalk folder');
    }

    // Upload file
    const accessToken = tokenData.access_token;
    
    // First create the file metadata
    const metadataResponse = await fetch(`${UPLOAD_API_URL}/files?uploadType=resumable`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'X-Upload-Content-Type': file.type || 'application/epub+zip',
      },
      body: JSON.stringify({
        name: filename,
        parents: [folderId],
      }),
    });

    if (!metadataResponse.ok) {
      throw new Error(`Failed to initiate upload: ${metadataResponse.statusText}`);
    }

    // Get the upload URL
    const uploadUrl = metadataResponse.headers.get('Location');
    if (!uploadUrl) {
      throw new Error('Failed to get upload URL');
    }

    // Upload the actual file content
    const uploadResponse = await fetch(uploadUrl, {
      method: 'PUT',
      headers: {
        'Content-Type': file.type || 'application/epub+zip',
      },
      body: file,
    });

    if (!uploadResponse.ok) {
      throw new Error(`Failed to upload file: ${uploadResponse.statusText}`);
    }

    const fileData = await uploadResponse.json();
    return fileData.id;
  } catch (error) {
    console.error('Error uploading book file:', error);
    return null;
  }
}

/**
 * Downloads a book file from Google Drive
 * @param fileId The ID of the file to download
 * @returns The file as a Blob
 */
export async function downloadBookFile(fileId: string): Promise<Blob | null> {
  try {
    // First check if the user_drive_tokens table exists
    const tableExists = await checkTableExists();
    if (!tableExists) {
      console.error('The user_drive_tokens table does not exist. Please create it in Supabase dashboard.');
      return null;
    }
    
    const { data: userData } = await supabase.auth.getUser();
    if (!userData?.user) {
      throw new Error('User not authenticated');
    }

    // Get current tokens
    const { data: tokenData, error: tokenError } = await supabase
      .from('user_drive_tokens')
      .select('*')
      .eq('id', userData.user.id)
      .single();

    if (tokenError || !tokenData) {
      throw new Error('Google Drive tokens not found');
    }

    // Download file
    const accessToken = tokenData.access_token;
    
    const response = await fetch(`${API_BASE_URL}/files/${fileId}?alt=media`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to download file: ${response.statusText}`);
    }

    return await response.blob();
  } catch (error) {
    console.error('Error downloading book file:', error);
    return null;
  }
}

/**
 * Refreshes the Google Drive access token when it expires
 */
export async function refreshDriveToken(): Promise<boolean> {
  try {
    // First check if the user_drive_tokens table exists
    const tableExists = await checkTableExists();
    if (!tableExists) {
      console.error('The user_drive_tokens table does not exist. Please create it in Supabase dashboard.');
      return false;
    }
    
    const { data: userData } = await supabase.auth.getUser();
    if (!userData?.user) {
      return false;
    }

    // Get current tokens
    const { data: tokenData, error: tokenError } = await supabase
      .from('user_drive_tokens')
      .select('*')
      .eq('id', userData.user.id)
      .single();

    if (tokenError || !tokenData) {
      return false;
    }

    // Check if token is expired
    const now = new Date();
    const expiryTime = new Date(tokenData.expiry_time);
    
    if (now < expiryTime) {
      // Token is still valid
      return true;
    }

    // Token is expired, refresh it
    const { data, error } = await supabase.auth.refreshSession();
    
    if (error || !data.session) {
      console.error('Failed to refresh session:', error);
      return false;
    }
    
    // We need to extract the provider token from the refreshed session
    const { provider_token, expires_in } = data.session;
    
    if (!provider_token) {
      console.error('No provider token in refreshed session');
      return false;
    }
    
    // Calculate new expiry time
    const newExpiryTime = new Date();
    newExpiryTime.setSeconds(newExpiryTime.getSeconds() + (expires_in || 3600));
    
    // Update token in database
    const { error: updateError } = await supabase
      .from('user_drive_tokens')
      .update({
        access_token: provider_token,
        expiry_time: newExpiryTime.toISOString(),
      })
      .eq('id', userData.user.id);
      
    if (updateError) {
      console.error('Failed to update token:', updateError);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Error refreshing Drive token:', error);
    return false;
  }
} 