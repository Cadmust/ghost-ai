"use client";

import { Network, Lock, FileText } from "lucide-react";

export default function AuthSidebar() {
  return (
    <div className="hidden md:flex flex-col justify-between md:w-1/2 bg-neutral-950 p-12 border-r border-gray-800">
      <div>
        {/* Logo */}
        <div className="flex items-center gap-3 mb-16">
          <div className="w-8 h-8 bg-cyan-500 rounded" style={{ backgroundColor: "#00c8d4" }}></div>
          <span className="text-lg font-semibold text-white tracking-tight">Ghost AI</span>
        </div>

        {/* Main Headline */}
        <div className="mb-16">
          <h1 className="text-5xl lg:text-6xl font-bold text-white leading-tight mb-6">
            Design systems at the speed of thought.
          </h1>
          <p className="text-base text-gray-400 leading-relaxed">
            Describe your architecture in plain English. Ghost AI maps it to a shared canvas your whole team can refine in real time.
          </p>
        </div>

        {/* Features */}
        <div className="space-y-8">
          {/* Feature 1 */}
          <div className="flex gap-4">
            <div className="flex-shrink-0 pt-1">
              <Network className="w-5 h-5" style={{ color: "#00c8d4" }} />
            </div>
            <div>
              <h3 className="text-white font-semibold text-sm mb-2">AI Architecture Generation</h3>
              <p className="text-gray-400 text-sm leading-relaxed">
                Describe your system. AI maps it to nodes and edges on a live canvas.
              </p>
            </div>
          </div>

          {/* Feature 2 */}
          <div className="flex gap-4">
            <div className="flex-shrink-0 pt-1">
              <Lock className="w-5 h-5" style={{ color: "#00c8d4" }} />
            </div>
            <div>
              <h3 className="text-white font-semibold text-sm mb-2">Real-time Collaboration</h3>
              <p className="text-gray-400 text-sm leading-relaxed">
                Live cursors, presence indicators, and shared node editing across your team.
              </p>
            </div>
          </div>

          {/* Feature 3 */}
          <div className="flex gap-4">
            <div className="flex-shrink-0 pt-1">
              <FileText className="w-5 h-5" style={{ color: "#00c8d4" }} />
            </div>
            <div>
              <h3 className="text-white font-semibold text-sm mb-2">Instant Spec Generation</h3>
              <p className="text-gray-400 text-sm leading-relaxed">
                Export a complete Markdown technical spec directly from the canvas graph.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="text-gray-600 text-xs">
        © 2024 Ghost AI. All rights reserved.
      </div>
    </div>
  );
}
