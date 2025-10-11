
import React from 'react';

export const PlayIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
        <path d="M4.5 5.653c0-1.426 1.529-2.33 2.779-1.643l11.54 6.647c1.295.742 1.295 2.545 0 3.286L7.279 20.99c-1.25.717-2.779-.217-2.779-1.643V5.653Z" />
    </svg>
);

export const StopIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
        <path d="M5.25 6.375a1.125 1.125 0 0 1 1.125-1.125h11.25a1.125 1.125 0 0 1 1.125 1.125v11.25a1.125 1.125 0 0 1-1.125 1.125H6.375a1.125 1.125 0 0 1-1.125-1.125V6.375Z" />
    </svg>
);

export const MicIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 0 0 6-6v-1.5a6 6 0 0 0-12 0v1.5a6 6 0 0 0 6 6Z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5" />
    </svg>
);

export const CogIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-1.007 1.11-.95.542.057.95.56.95 1.11 0 .09-.01.178-.03.264l.87-1.125a.375.375 0 0 1 .53-.043l1.832 1.415c.16.123.19.355.07.53l-1.125.87c.1.08.18.17.26.26l1.125-.87a.375.375 0 0 1 .53.07l1.415 1.832c.123.16.09.38-.043.53l-.87 1.125c.08.18.14.37.19.57l1.125.87c.16.123.19.355.07.53l-1.415 1.832c-.123.16-.355.19-.53.07l-1.125-.87a5.25 5.25 0 0 1-.6.52l.87 1.125a.375.375 0 0 1-.043.53l-1.832 1.415a.375.375 0 0 1-.53-.07l-.87-1.125a5.25 5.25 0 0 1-.57.19l-.87 1.125a.375.375 0 0 1-.53.043l-1.832-1.415a.375.375 0 0 1-.07-.53l1.125-.87a5.25 5.25 0 0 1-.52-.6l-1.125.87a.375.375 0 0 1-.53-.07l-1.415-1.832c-.123-.16-.09-.38.043-.53l.87-1.125a5.25 5.25 0 0 1-.19-.57l-1.125-.87a.375.375 0 0 1-.07-.53l1.415-1.832a.375.375 0 0 1 .53-.043l1.125.87c.08-.18.17-.37.26-.57l-1.125-.87a.375.375 0 0 1-.043-.53l1.832-1.415a.375.375 0 0 1 .53.07l.87 1.125c.18-.08.37-.14.57-.19Z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
    </svg>
);
