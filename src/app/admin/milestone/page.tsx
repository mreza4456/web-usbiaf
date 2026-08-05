"use client";
import React, { useState, useEffect } from 'react';
import { Award, Edit2, Save, X, Gift, CheckCircle, AlertCircle } from 'lucide-react';
import { IMilestoneReward } from '@/interface';
import { getMilestoneRewards, updateMilestoneReward, toggleMilestoneReward } from '@/action/vouchers';
import { SiteHeader } from '@/components/site-header';

// Admin page untuk mengatur milestone rewards
export default function AdminMilestoneRewards() {
    const [rewards, setRewards] = useState<IMilestoneReward[]>([]);
    const [loading, setLoading] = useState(true);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [editValue, setEditValue] = useState('');
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });

    useEffect(() => {
        loadRewards();
    }, []);

    const loadRewards = async () => {
        setLoading(true);
        try {
            const result = await getMilestoneRewards();
            if (result.success && result.data) {
                setRewards(result.data);
            } else {
                showMessage('error', 'Failed to load rewards');
            }
        } catch (error) {
            console.error('Error loading rewards:', error);
            showMessage('error', 'Failed to load rewards');
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (reward: IMilestoneReward) => {
        setEditingId(reward.milestone_step);
        setEditValue(reward.voucher_value);
    };

    const handleSave = async (milestoneStep: number) => {
        if (!editValue.trim()) {
            showMessage('error', 'Voucher value cannot be empty');
            return;
        }

        // Validasi format (opsional: pastikan format % benar)
        if (!editValue.includes('%')) {
            showMessage('error', 'Voucher value must include % (e.g., 5%, 10%)');
            return;
        }

        setSaving(true);
        try {
            const result = await updateMilestoneReward(milestoneStep, editValue);

            if (result.success && result.data) {
                // Update state dengan data baru
                setRewards(rewards.map(r =>
                    r.milestone_step === milestoneStep
                        ? { ...r, voucher_value: editValue, updated_at: result.data.updated_at }
                        : r
                ));

                setEditingId(null);
                setEditValue('');
                showMessage('success', 'Reward updated successfully!');
            } else {
                showMessage('error', result.error || 'Failed to update reward');
            }
        } catch (error) {
            console.error('Error saving reward:', error);
            showMessage('error', 'Failed to update reward');
        } finally {
            setSaving(false);
        }
    };

    const handleToggleActive = async (milestoneStep: number, currentStatus: boolean) => {
        try {
            const result = await toggleMilestoneReward(milestoneStep, !currentStatus);

            if (result.success && result.data) {
                // Update state dengan status baru
                setRewards(rewards.map(r =>
                    r.milestone_step === milestoneStep
                        ? { ...r, is_active: !currentStatus, updated_at: result.data.updated_at }
                        : r
                ));

                showMessage('success', `Reward ${!currentStatus ? 'activated' : 'deactivated'}`);
            } else {
                showMessage('error', result.error || 'Failed to toggle reward status');
            }
        } catch (error) {
            console.error('Error toggling reward:', error);
            showMessage('error', 'Failed to toggle reward status');
        }
    };

    const handleCancel = () => {
        setEditingId(null);
        setEditValue('');
    };

    const showMessage = (type: string, text: string) => {
        setMessage({ type, text });
        setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Loading rewards...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="w-full">
            <SiteHeader title="Milestone" />

            <div className="min-h-screen bg-gray-50 pb-10 px-7">
                <div className="my-7">
                    <h1 className="text-3xl font-bold mb-2">Milestone Rewards Management</h1>
                    <p className="text-gray-500">Configure voucher rewards for customer milestone achievements</p>
                </div>
                <div className="w-full mx-auto ">

                    {/* Message Alert */}
                    {message.text && (
                        <div className={`mb-6 p-4 rounded-lg ${message.type === 'success'
                            ? 'bg-green-50 border border-green-200 text-green-800'
                            : 'bg-red-50 border border-red-200 text-red-800'
                            }`}>
                            <div className="flex items-center gap-2">
                                {message.type === 'success' ? (
                                    <CheckCircle className="w-5 h-5" />
                                ) : (
                                    <AlertCircle className="w-5 h-5" />
                                )}
                                <span className="font-medium">{message.text}</span>
                            </div>
                        </div>
                    )}

                    {/* Empty State */}
                    {rewards.length === 0 ? (
                        <div className="bg-white rounded-lg shadow-md p-12 text-center">
                            <Award className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Rewards Configured</h3>
                            <p className="text-gray-600">Please set up milestone rewards in the database first.</p>
                        </div>
                    ) : (
                        <>
                            {/* Rewards Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 ">
                                {rewards.map((reward) => (
                                    <div
                                        key={reward.id}
                                        className={`bg-white rounded-lg shadow-md p-6 border-2 transition-all ${reward.is_active
                                            ? 'border-slate-300'
                                            : 'border-gray-300 opacity-60'
                                            }`}
                                    >
                                        {/* Header */}
                                        <div className="flex items-center justify-between mb-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-12 h-12 rounded-full bg-slate-700 flex items-center justify-center text-white font-bold text-lg">
                                                    {reward.milestone_step}
                                                </div>
                                                <div>
                                                    <h3 className="font-bold text-gray-900">Step {reward.milestone_step}</h3>
                                                    <p className="text-xs text-gray-500">Milestone Reward</p>
                                                </div>
                                            </div>
                                            <Gift className="w-6 h-6 text-slate-500" />
                                        </div>

                                        {/* Voucher Value */}
                                        <div className="mb-4">
                                            <label className="text-sm font-medium text-gray-700 mb-2 block">
                                                Voucher Value
                                            </label>
                                            {editingId === reward.milestone_step ? (
                                                <input
                                                    type="text"
                                                    value={editValue}
                                                    onChange={(e) => setEditValue(e.target.value)}
                                                    placeholder="e.g., 5%, 10%, 15%"
                                                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-transparent outline-none"
                                                    autoFocus
                                                />
                                            ) : (
                                                <div className="bg-background rounded-lg px-4 py-3 border border-slate-200">
                                                    <span className="text-2xl font-bold text-slate-700">
                                                        {reward.voucher_value}
                                                    </span>
                                                    <span className="text-sm text-gray-600 ml-2">discount</span>
                                                </div>
                                            )}
                                        </div>

                                        {/* Action Buttons */}
                                        <div className="flex gap-2">
                                            {editingId === reward.milestone_step ? (
                                                <>
                                                    <button
                                                        onClick={() => handleSave(reward.milestone_step)}
                                                        disabled={saving}
                                                        className="flex-1 bg-slate-600 text-white px-4 py-2 rounded-lg hover:bg-slate-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                                    >
                                                        <Save className="w-4 h-4" />
                                                        {saving ? 'Saving...' : 'Save'}
                                                    </button>
                                                    <button
                                                        onClick={handleCancel}
                                                        disabled={saving}
                                                        className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                                    >
                                                        <X className="w-4 h-4" />
                                                    </button>
                                                </>
                                            ) : (
                                                <>
                                                    <button
                                                        onClick={() => handleEdit(reward)}
                                                        className="flex-1 border border-slate-300 text-slate-500 px-4 py-2 rounded-lg hover:bg-slate-50 transition-colors flex items-center justify-center gap-2"
                                                    >
                                                        <Edit2 className="w-4 h-4" />
                                                        Edit
                                                    </button>
                                                    <button
                                                        onClick={() => handleToggleActive(reward.milestone_step, reward.is_active)}
                                                        className={`flex-1 px-4 py-2 rounded-lg transition-colors ${reward.is_active
                                                            ? 'bg-red-50 text-red-600 border border-red-200 hover:bg-red-100'
                                                            : 'bg-green-50 text-green-600 border border-green-200 hover:bg-green-100'
                                                            }`}
                                                    >
                                                        {reward.is_active ? 'Deactivate' : 'Activate'}
                                                    </button>
                                                </>
                                            )}
                                        </div>

                                        {/* Status Badge & Last Updated */}
                                        <div className="mt-3 flex items-center justify-between">
                                            <span className={`inline-flex items-center gap-1 text-xs font-medium px-3 py-1 rounded-full ${reward.is_active
                                                ? 'bg-green-100 text-green-700'
                                                : 'bg-gray-100 text-gray-600'
                                                }`}>
                                                {reward.is_active ? '● Active' : '○ Inactive'}
                                            </span>
                                            {reward.updated_at && (
                                                <span className="text-xs text-gray-500">
                                                    Updated: {new Date(reward.updated_at).toLocaleDateString('en-US', {
                                                        month: 'short',
                                                        day: 'numeric'
                                                    })}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Info Card */}

                        </>
                    )}
                </div>
            </div>
        </div>
    );
}