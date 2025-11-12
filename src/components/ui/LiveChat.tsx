'use client';

import { useState, useRef, useEffect } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import { 
  XMarkIcon, 
  PaperAirplaneIcon, 
  ChatBubbleLeftRightIcon,
  UserIcon
} from '@heroicons/react/24/outline';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'agent';
  timestamp: Date;
}

interface LiveChatProps {
  isOpen: boolean;
  onClose: () => void;
}

const LiveChat: React.FC<LiveChatProps> = ({ isOpen, onClose }) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: 'Hello! Welcome to Elanorra Living. How can I help you today?',
      sender: 'agent',
      timestamp: new Date()
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const simulateAgentResponse = (userMessage: string) => {
    setIsTyping(true);
    
    setTimeout(() => {
      let response = '';
      const lowerMessage = userMessage.toLowerCase();
      
      if (lowerMessage.includes('price') || lowerMessage.includes('cost')) {
        response = 'Our products range from ₹500 to ₹15,000. You can find detailed pricing on each product page. Would you like me to help you find something specific?';
      } else if (lowerMessage.includes('shipping') || lowerMessage.includes('delivery')) {
        response = 'We offer free shipping on orders above ₹2,000. Standard delivery takes 3-5 business days. Express delivery is available for ₹200 extra.';
      } else if (lowerMessage.includes('return') || lowerMessage.includes('exchange')) {
        response = 'We have a 30-day return policy. Items must be in original condition. You can initiate a return from your account page or contact us directly.';
      } else if (lowerMessage.includes('product') || lowerMessage.includes('item')) {
        response = 'We specialize in premium home decor, tableware, and lifestyle products. What type of product are you looking for?';
      } else if (lowerMessage.includes('hello') || lowerMessage.includes('hi')) {
        response = 'Hello! Thanks for reaching out. I\'m here to help with any questions about our products, orders, or services.';
      } else if (lowerMessage.includes('help') || lowerMessage.includes('support')) {
        response = 'I\'m here to help! You can ask me about our products, shipping, returns, or any other questions. What would you like to know?';
      } else {
        response = 'Thank you for your message. Let me connect you with one of our specialists who can provide more detailed assistance. In the meantime, you can also email us at info@elanorraliving.in or call +91 9876543210.';
      }

      const agentMessage: Message = {
        id: Date.now().toString(),
        text: response,
        sender: 'agent',
        timestamp: new Date()
      };

      setMessages(prev => [...prev, agentMessage]);
      setIsTyping(false);
    }, 1500 + Math.random() * 1000); // Random delay between 1.5-2.5 seconds
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!inputMessage.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputMessage,
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');

    // Simulate agent response
    simulateAgentResponse(inputMessage);
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    });
  };

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black bg-opacity-25" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white text-left align-middle shadow-xl transition-all">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gradient-to-r from-[var(--accent)] to-[color:rgb(186,156,109)]">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                      <ChatBubbleLeftRightIcon className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-white">Live Chat</h3>
                      <p className="text-sm text-white/80">We're here to help!</p>
                    </div>
                  </div>
                  <button
                    onClick={onClose}
                    className="text-white/80 hover:text-white transition-colors"
                  >
                    <XMarkIcon className="w-6 h-6" />
                  </button>
                </div>

                {/* Messages */}
                <div className="h-96 overflow-y-auto p-4 space-y-4">
                  <AnimatePresence>
                    {messages.map((message) => (
                      <motion.div
                        key={message.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                      >
                        <div className={`flex items-start space-x-2 max-w-xs ${message.sender === 'user' ? 'flex-row-reverse space-x-reverse' : ''}`}>
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                            message.sender === 'user' 
                              ? 'bg-[var(--accent)]' 
                              : 'bg-gray-200'
                          }`}>
                            {message.sender === 'user' ? (
                              <UserIcon className="w-4 h-4 text-white" />
                            ) : (
                              <ChatBubbleLeftRightIcon className="w-4 h-4 text-gray-600" />
                            )}
                          </div>
                          <div className={`rounded-lg px-3 py-2 ${
                            message.sender === 'user'
                              ? 'bg-[var(--accent)] text-white'
                              : 'bg-gray-100 text-gray-900'
                          }`}>
                            <p className="text-sm">{message.text}</p>
                            <p className={`text-xs mt-1 ${
                              message.sender === 'user' ? 'text-white/80' : 'text-gray-500'
                            }`}>
                              {formatTime(message.timestamp)}
                            </p>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>

                  {/* Typing indicator */}
                  {isTyping && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex justify-start"
                    >
                      <div className="flex items-start space-x-2 max-w-xs">
                        <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                          <ChatBubbleLeftRightIcon className="w-4 h-4 text-gray-600" />
                        </div>
                        <div className="bg-gray-100 rounded-lg px-3 py-2">
                          <div className="flex space-x-1">
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  <div ref={messagesEndRef} />
                </div>

                {/* Input */}
                <div className="border-t border-gray-200 p-4">
                  <form onSubmit={handleSendMessage} className="flex space-x-2">
                    <input
                      type="text"
                      value={inputMessage}
                      onChange={(e) => setInputMessage(e.target.value)}
                      placeholder="Type your message..."
                      className="flex-1 border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[var(--ring)] focus:border-transparent"
                      disabled={isTyping}
                    />
                    <button
                      type="submit"
                      disabled={!inputMessage.trim() || isTyping}
                      className="bg-[var(--accent)] text-white p-2 rounded-lg hover:bg-[color:rgb(186,156,109)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      <PaperAirplaneIcon className="w-5 h-5" />
                    </button>
                  </form>
                  <p className="text-xs text-gray-500 mt-2 text-center">
                    For complex queries, our team will follow up via email
                  </p>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
};

export default LiveChat;