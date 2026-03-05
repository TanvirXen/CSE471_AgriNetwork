import React from 'react';
import { Bot, User, Leaf } from 'lucide-react';

const ChatMessage = ({ message, isTyping }) => {
    const isBot = message?.isBot || isTyping;

    return (
        <div className={`flex w-full mb-6 ${isBot ? 'justify-start' : 'justify-end'} animate-message`}>
            <div className={`flex max-w-[85%] sm:max-w-[75%] ${isBot ? 'flex-row' : 'flex-row-reverse'}`}>

                {/* Avatar */}
                <div className={`flex-shrink-0 flex items-center justify-center w-10 h-10 rounded-full shadow-md ${isBot ? 'bg-gradient-to-br from-emerald-100 to-green-200 text-emerald-600 border border-emerald-300 mr-3'
                        : 'bg-gradient-to-br from-blue-100 to-indigo-100 text-blue-600 border border-blue-200 ml-3'
                    }`}>
                    {isBot ? <Leaf size={20} /> : <User size={20} />}
                </div>

                {/* Message Bubble */}
                <div className="flex flex-col">
                    <div className={`p-4 rounded-2xl shadow-sm relative ${isBot
                            ? 'bg-white border border-emerald-100 text-gray-800 rounded-tl-none'
                            : 'bg-emerald-600 text-white rounded-tr-none shadow-emerald-200/50'
                        }`}>

                        {/* Name label */}
                        {isBot && !isTyping && (
                            <span className="text-xs font-semibold text-emerald-600 mb-1 block">
                                AgriAssist AI
                            </span>
                        )}

                        {/* Content or Typing Dots */}
                        {isTyping ? (
                            <div className="typing-dots h-6">
                                <div className="typing-dot"></div>
                                <div className="typing-dot"></div>
                                <div className="typing-dot"></div>
                            </div>
                        ) : (
                            <div className="text-[15px] leading-relaxed whitespace-pre-wrap font-medium">
                                {message?.text}
                            </div>
                        )}
                    </div>

                    {/* Timestamp */}
                    {!isTyping && message?.timestamp && (
                        <div className={`text-xs text-gray-400 mt-1.5 px-1 ${isBot ? 'text-left' : 'text-right'}`}>
                            {message.timestamp}
                        </div>
                    )}
                </div>

            </div>
        </div>
    );
};

export default ChatMessage;
