'use client';

import { SignUp, useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";

export default function SignUpPage() {
    return(
        <div className="flex flex-col min-h-screen items-center justify-center bg-[#1d1f2b]">
        <SignUp 
            forceRedirectUrl="/workspace"
        />
        </div>
    )
}

