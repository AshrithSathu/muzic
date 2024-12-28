"use client";
import { signIn, signOut, useSession } from "next-auth/react";
import React from "react";

export default function Appbar() {
  const session = useSession();
  return (
    <div className="w-full bg-[#1a1a1a] p-4">
      <div className="flex justify-between items-center">
        <h1 className="text-white text-2xl font-bold">Muzic</h1>

        {session.data?.user && (
          <button
            onClick={() => {
              signOut();
            }}
            className="text-white hover:text-gray-300 px-4 py-2"
          >
            Sign Out
          </button>
        )}
        {!session.data?.user && (
          <button
            onClick={() => {
              signIn("google");
            }}
            className="text-white hover:text-gray-300 px-4 py-2"
          >
            Sign In
          </button>
        )}
      </div>
    </div>
  );
}
