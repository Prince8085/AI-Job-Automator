
import React, { useState, useEffect } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import { useJobData } from '../contexts/JobDataContext';
import { findPotentialContacts, generateOutreachMessage } from '../services/geminiService';
import ScreenWrapper from '../components/ScreenWrapper';
import LoadingSpinner from '../components/LoadingSpinner';
import { Job, PotentialContact } from '../types';
import { MOCK_POTENTIAL_CONTACTS } from '../constants';
import { UserIcon, SparklesIcon, ClipboardCopyIcon, CheckIcon, LinkedInIcon, AtSymbolIcon, InformationCircleIcon } from '../components/icons';

const NetworkingAssistantScreen: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const location = useLocation();
    const { getJobById, userProfile, showToast } = useJobData();

    const [job, setJob] = useState<Job | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [contacts, setContacts] = useState<PotentialContact[]>([]);
    const [isMockData, setIsMockData] = useState(false);
    const [selectedContact, setSelectedContact] = useState<PotentialContact | null>(null);
    const [outreachMessage, setOutreachMessage] = useState('');
    const [isGeneratingMessage, setIsGeneratingMessage] = useState(false);
    const [isCopied, setIsCopied] = useState(false);

    useEffect(() => {
        if (location.state?.jobData) {
            setJob(location.state.jobData);
        } else if (id) {
            const foundJob = getJobById(id);
            if (foundJob) setJob(foundJob);
        }
    }, [id, getJobById, location.state]);

    const handleFindContacts = async () => {
        if (!job) return;
        setIsLoading(true);
        setContacts([]);
        setIsMockData(false);
        setSelectedContact(null);
        setOutreachMessage('');
        try {
            const result = await findPotentialContacts(job.company);
            if (result && result.length > 0) {
                setContacts(result);
                showToast(`Found ${result.length} potential contacts!`, 'success');
            } else {
                setContacts(MOCK_POTENTIAL_CONTACTS);
                setIsMockData(true);
                showToast('Could not find live contacts. Displaying sample data.', 'info');
            }
        } catch (err: any) {
            showToast(err.message || 'Error finding contacts.', 'error');
            setContacts(MOCK_POTENTIAL_CONTACTS);
            setIsMockData(true);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSelectContact = async (contact: PotentialContact) => {
        setSelectedContact(contact);
        setIsGeneratingMessage(true);
        setOutreachMessage('');
        try {
            const message = await generateOutreachMessage(userProfile.name, contact, job?.title || '');
            setOutreachMessage(message);
        } catch (err: any) {
            showToast(err.message || 'Error generating message.', 'error');
        } finally {
            setIsGeneratingMessage(false);
        }
    };
    
    const handleCopyToClipboard = () => {
        navigator.clipboard.writeText(outreachMessage);
        setIsCopied(true);
        showToast('Copied to clipboard!', 'success');
        setTimeout(() => setIsCopied(false), 2000);
    };

    if (!job) return <ScreenWrapper><LoadingSpinner text="Loading..." /></ScreenWrapper>;

    return (
        <ScreenWrapper>
            <div className="bg-white p-6 rounded-lg shadow-lg space-y-4">
                <h2 className="text-2xl font-bold text-text-primary">AI Networking Assistant</h2>
                <p className="text-text-secondary">Find contacts and craft outreach messages for the role at <span className="font-semibold text-primary">{job.company}</span>.</p>
                <button
                    onClick={handleFindContacts}
                    disabled={isLoading}
                    className="w-full py-3 px-6 text-white font-bold bg-primary rounded-lg hover:bg-indigo-700 transition disabled:bg-indigo-300 disabled:cursor-wait"
                >
                    {isLoading ? 'Searching...' : '✨ Find Potential Contacts'}
                </button>
            </div>

            {isLoading && <LoadingSpinner text="AI is searching for contacts..." />}

            {contacts.length > 0 && (
                <div className="bg-white p-6 rounded-lg shadow-lg">
                    <h3 className="text-xl font-bold text-text-primary mb-2">Potential Contacts</h3>
                    <p className="text-text-secondary mb-4 text-sm">Click a contact to generate a personalized outreach message.</p>
                    
                    {isMockData && (
                      <div className="bg-yellow-50 text-yellow-800 p-3 rounded-lg text-sm mb-4 flex items-center">
                        <InformationCircleIcon className="w-5 h-5 mr-2 flex-shrink-0" />
                        <span>Could not find live contacts. Displaying sample data to demonstrate the feature.</span>
                      </div>
                    )}

                    <div className="space-y-3">
                        {contacts.map((contact, index) => (
                            <div key={index}>
                                <div className="w-full text-left p-4 bg-slate-50 rounded-lg border border-slate-200">
                                    <div className="flex justify-between items-center">
                                      <div className="flex items-center">
                                        <div className="flex-shrink-0 bg-primary text-white w-10 h-10 rounded-full flex items-center justify-center">
                                            <UserIcon className="w-6 h-6" />
                                        </div>
                                        <div className="ml-4">
                                            <p className="font-bold text-text-primary">{contact.name}</p>
                                            <p className="text-sm text-text-secondary">{contact.title}</p>
                                        </div>
                                      </div>
                                      <div className="flex items-center space-x-2">
                                        {contact.linkedinUrl && (
                                            <a href={contact.linkedinUrl} target="_blank" rel="noopener noreferrer" className="p-2 rounded-full hover:bg-slate-200 text-blue-700">
                                                <LinkedInIcon className="w-5 h-5"/>
                                            </a>
                                        )}
                                        {contact.email && (
                                            <a href={`mailto:${contact.email}`} className="p-2 rounded-full hover:bg-slate-200 text-text-secondary">
                                                <AtSymbolIcon className="w-5 h-5"/>
                                            </a>
                                        )}
                                      </div>
                                    </div>
                                    <button onClick={() => handleSelectContact(contact)} className="mt-3 text-sm font-semibold text-primary hover:text-indigo-700">
                                        Generate outreach message
                                    </button>
                                </div>
                                {selectedContact?.name === contact.name && (
                                    <div className="p-4 bg-indigo-50 rounded-b-lg border-x border-b border-indigo-200">
                                        {isGeneratingMessage ? (
                                            <LoadingSpinner text="Generating message..." />
                                        ) : (
                                            <div className="space-y-3">
                                                <h4 className="font-semibold flex items-center"><SparklesIcon className="w-5 h-5 mr-2 text-secondary"/> Generated Outreach Message</h4>
                                                <div className="p-3 bg-white border border-slate-200 rounded-md whitespace-pre-wrap leading-relaxed">
                                                    {outreachMessage}
                                                </div>
                                                <button
                                                    onClick={handleCopyToClipboard}
                                                    disabled={isCopied}
                                                    className={`px-4 py-2 text-sm font-semibold text-white rounded-lg transition ${isCopied ? 'bg-green-500' : 'bg-secondary hover:bg-emerald-600'}`}
                                                >
                                                    {isCopied ? (
                                                        <span className="flex items-center"><CheckIcon className="w-5 h-5 mr-2" /> Copied!</span>
                                                    ) : (
                                                        <span className="flex items-center"><ClipboardCopyIcon className="w-5 h-5 mr-2" /> Copy Message</span>
                                                    )}
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </ScreenWrapper>
    );
};

export default NetworkingAssistantScreen;
