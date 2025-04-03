
interface EmptyMessagesProps {
  message?: string;
}

export function EmptyMessages({ 
  message = "No messages yet. Send a message to start the conversation." 
}: EmptyMessagesProps) {
  return (
    <div className="py-10 text-center text-gray-500">
      {message}
    </div>
  );
}
