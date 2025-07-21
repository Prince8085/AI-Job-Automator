
import React, { useState, useRef } from 'react';
import { useJobData } from '../contexts/JobDataContext';
import ScreenWrapper from '../components/ScreenWrapper';
import { UserProfile } from '../types';
import { parseResumeForProfile } from '../services/geminiService';
import LoadingSpinner from '../components/LoadingSpinner';
import { DocumentArrowUpIcon, CameraIcon } from '../components/icons';
import { useNavigate } from 'react-router-dom';

const fileToGenerativePart = async (file: File) => {
  const base64EncodedDataPromise = new Promise<string>((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
    reader.readAsDataURL(file);
  });
  return {
    inlineData: {
      mimeType: file.type,
      data: await base64EncodedDataPromise,
    },
  };
};

const ProfileScreen: React.FC = () => {
  const { userProfile, updateUserProfile, showToast, logout } = useJobData();
  const [profile, setProfile] = useState<UserProfile>(userProfile);
  const [isEditing, setIsEditing] = useState(false);
  const [isParsing, setIsParsing] = useState(false);
  const navigate = useNavigate();
  
  const coverPhotoInputRef = useRef<HTMLInputElement>(null);
  const profilePictureInputRef = useRef<HTMLInputElement>(null);
  const resumeInputRef = useRef<HTMLInputElement>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setProfile(prev => ({ ...prev, [name]: value }));
     if (!isEditing) setIsEditing(true);
  };
  
  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'profilePictureUrl' | 'coverPhotoUrl') => {
      if (e.target.files && e.target.files[0]) {
          const file = e.target.files[0];
          const reader = new FileReader();
          reader.onloadend = () => {
              setProfile(prev => ({ ...prev, [type]: reader.result as string }));
          };
          reader.readAsDataURL(file);
          if (!isEditing) setIsEditing(true);
      }
  };

  const handleResumeUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setIsParsing(true);
      try {
        const filePart = await fileToGenerativePart(file);
        const parsedData = await parseResumeForProfile(filePart);
        setProfile(prev => ({
            ...prev,
            name: parsedData.name || prev.name,
            bio: parsedData.bio || prev.bio,
            baseResume: parsedData.baseResume || prev.baseResume
        }));
        showToast('Profile auto-filled from resume!', 'success');
        if (!isEditing) setIsEditing(true);
      } catch (err: any) {
        showToast(err.message || "Failed to parse resume.", 'error');
      } finally {
        setIsParsing(false);
        // Reset file input
        if (e.target) e.target.value = '';
      }
    }
  };

  const handleSave = () => {
    updateUserProfile(profile);
    setIsEditing(false);
    showToast('Profile updated successfully!', 'success');
  };

  const handleCancel = () => {
    setProfile(userProfile);
    setIsEditing(false);
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <ScreenWrapper>
      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        <div className="relative">
          <img src={profile.coverPhotoUrl || 'https://images.unsplash.com/photo-1554629947-334ff61d85dc?q=80&w=2836&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D'} alt="Cover" className="w-full h-48 object-cover"/>
          <button onClick={() => coverPhotoInputRef.current?.click()} className="absolute top-2 right-2 bg-black/50 p-2 rounded-full text-white hover:bg-black/70">
            <CameraIcon className="w-5 h-5"/>
          </button>
          <input type="file" ref={coverPhotoInputRef} onChange={(e) => handlePhotoChange(e, 'coverPhotoUrl')} className="hidden" accept="image/*"/>
          <div className="absolute -bottom-16 left-6">
            <div className="relative">
               <img src={profile.profilePictureUrl || 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=2788&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D'} alt="Profile" className="w-32 h-32 rounded-full border-4 border-white object-cover shadow-md"/>
               <button onClick={() => profilePictureInputRef.current?.click()} className="absolute bottom-1 right-1 bg-black/50 p-2 rounded-full text-white hover:bg-black/70">
                 <CameraIcon className="w-4 h-4"/>
               </button>
               <input type="file" ref={profilePictureInputRef} onChange={(e) => handlePhotoChange(e, 'profilePictureUrl')} className="hidden" accept="image/*"/>
            </div>
          </div>
        </div>
        
        <div className="pt-20 p-6 space-y-6">
           <div className="flex justify-end items-center space-x-2">
            {!isEditing ? (
               <button onClick={handleLogout} className="px-4 py-2 text-sm font-semibold text-red-600 bg-red-100 rounded-lg hover:bg-red-200 transition">
                Logout
              </button>
            ) : (
              <>
                <button onClick={handleCancel} className="px-4 py-2 text-sm font-semibold text-text-secondary bg-slate-200 rounded-lg hover:bg-slate-300 transition">
                  Cancel
                </button>
                <button onClick={handleSave} className="px-4 py-2 text-sm font-semibold text-white bg-gradient-secondary rounded-lg hover:opacity-90 transition">
                  Save Changes
                </button>
              </>
            )}
          </div>
        
          <div className="space-y-4">
             <button onClick={() => resumeInputRef.current?.click()} disabled={isParsing} className="w-full flex items-center justify-center p-3 text-sm font-semibold text-primary bg-indigo-100 rounded-lg hover:bg-indigo-200 transition disabled:opacity-50">
              <DocumentArrowUpIcon className="w-5 h-5 mr-2"/>
              {isParsing ? 'Parsing Resume...' : 'Upload Resume to Autofill Profile'}
            </button>
            <input type="file" ref={resumeInputRef} onChange={handleResumeUpload} className="hidden" accept=".pdf,.txt,.md"/>
            
            {isParsing && <LoadingSpinner text="AI is parsing your resume..." />}

            <div>
              <label className="block text-sm font-medium text-text-secondary">Full Name</label>
              <input type="text" name="name" value={profile.name} onChange={handleInputChange} readOnly={!isEditing} className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm read-only:bg-slate-100 read-only:cursor-not-allowed"/>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               <div>
                  <label className="block text-sm font-medium text-text-secondary">LinkedIn Profile URL</label>
                  <input type="url" name="linkedinUrl" value={profile.linkedinUrl || ''} onChange={handleInputChange} readOnly={!isEditing} className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm read-only:bg-slate-100 read-only:cursor-not-allowed"/>
                </div>
                 <div>
                  <label className="block text-sm font-medium text-text-secondary">GitHub Profile URL</label>
                  <input type="url" name="githubUrl" value={profile.githubUrl || ''} onChange={handleInputChange} readOnly={!isEditing} className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm read-only:bg-slate-100 read-only:cursor-not-allowed"/>
                </div>
            </div>
             <div>
              <label className="block text-sm font-medium text-text-secondary">Portfolio/Website URL</label>
              <input type="url" name="portfolioUrl" value={profile.portfolioUrl || ''} onChange={handleInputChange} readOnly={!isEditing} className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm read-only:bg-slate-100 read-only:cursor-not-allowed"/>
            </div>

            <div>
              <label className="block text-sm font-medium text-text-secondary">Bio</label>
              <textarea name="bio" rows={4} value={profile.bio} onChange={handleInputChange} readOnly={!isEditing} className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm read-only:bg-slate-100 read-only:cursor-not-allowed"/>
            </div>
            <div>
              <label className="block text-sm font-medium text-text-secondary">Base Resume</label>
              <p className="text-xs text-text-secondary mb-1">This will be used by the AI to tailor applications.</p>
              <textarea name="baseResume" rows={15} value={profile.baseResume} onChange={handleInputChange} readOnly={!isEditing} className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm read-only:bg-slate-100 read-only:cursor-not-allowed font-mono text-sm"/>
            </div>
          </div>
        </div>
      </div>
    </ScreenWrapper>
  );
};

export default ProfileScreen;
