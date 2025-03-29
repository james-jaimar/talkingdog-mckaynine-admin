
import { Dog } from "lucide-react";

export function Header() {
  return (
    <header className="border-b bg-white">
      <div className="flex items-center h-16 px-6">
        <div className="flex items-center gap-2">
          <Dog className="h-8 w-8 text-mckaynine-600" />
          <span className="font-bold text-xl text-mckaynine-700">McKaynine</span>
        </div>
        <div className="ml-auto flex items-center gap-4">
          <span className="text-sm text-gray-600">Welcome, Admin</span>
        </div>
      </div>
    </header>
  );
}
