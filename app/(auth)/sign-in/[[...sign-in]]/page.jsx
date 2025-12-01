'use client';

import { SignIn, useUser } from "@clerk/nextjs";


export default function SignInPage() {
  
    return(
        <div className="flex flex-col min-h-screen items-center justify-center bg-[#1d1f2b]">
        <SignIn
        />
        </div>
    )
}











