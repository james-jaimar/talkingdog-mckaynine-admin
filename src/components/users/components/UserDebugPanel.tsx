
import { APP_ID } from "@/constants/app";

interface UserDebugPanelProps {
  userId: string | undefined;
  isAdmin: boolean;
  usersCount: number;
  diagnosticUsersCount: number;
}

export function UserDebugPanel({ userId, isAdmin, usersCount, diagnosticUsersCount }: UserDebugPanelProps) {
  return (
    <div className="mb-6 p-4 border border-indigo-200 bg-indigo-50 rounded-md overflow-auto">
      <h3 className="font-medium text-indigo-900 mb-2">Debug Information</h3>
      <ul className="text-xs space-y-1 text-indigo-800">
        <li><strong>Current User ID:</strong> {userId || 'Not logged in'}</li>
        <li><strong>Admin Status:</strong> {isAdmin ? 'Yes' : 'No'}</li>
        <li><strong>App ID:</strong> {APP_ID}</li>
        <li><strong>Edge Function:</strong> get-users (Configured: Yes)</li>
        <li><strong>Users from Hook:</strong> {usersCount}</li>
        <li><strong>Diagnostic Users:</strong> {diagnosticUsersCount}</li>
      </ul>
    </div>
  );
}
