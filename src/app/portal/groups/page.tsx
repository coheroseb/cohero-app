'use client';

import React, { useEffect } from 'react';
import { useApp } from '@/app/provider';
import AuthLoadingScreen from '@/components/AuthLoadingScreen';
import { generateGroupSsoTokenAction } from '@/app/actions';

const GroupSsoHandoverPage = () => {
    const { user, isUserLoading } = useApp();

    useEffect(() => {
        if (!isUserLoading && !user) {
            // User not logged in, just go to groups (it will ask for login there)
            window.location.href = 'https://group.cohero.dk';
            return;
        }

        if (user) {
            // User is logged in, generate a token and hand off
            const performSso = async () => {
                try {
                    const res = await generateGroupSsoTokenAction(user.uid);
                    if (res.success && res.token) {
                        window.location.href = `https://group.cohero.dk/auth/sso?token=${encodeURIComponent(res.token)}`;
                    } else {
                        // Fallback if token generation fails
                        window.location.href = 'https://group.cohero.dk';
                    }
                } catch (err) {
                    console.error("SSO Handoff Error:", err);
                    window.location.href = 'https://group.cohero.dk';
                }
            };
            performSso();
        }
    }, [user, isUserLoading]);

    return <AuthLoadingScreen />;
};

export default GroupSsoHandoverPage;
