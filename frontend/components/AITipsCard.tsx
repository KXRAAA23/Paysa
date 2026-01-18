import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Lightbulb, AlertTriangle, TrendingUp, CheckCircle2 } from "lucide-react";

interface Tip {
    id: string;
    type: 'warning' | 'insight' | 'saving' | 'positive';
    title: string;
    description: string;
    action?: string;
}

const AITipsCard: React.FC<{ tip: Tip }> = ({ tip }) => {
    const getIcon = () => {
        switch (tip.type) {
            case 'warning': return <AlertTriangle className="h-5 w-5 text-red-500" />;
            case 'insight': return <Lightbulb className="h-5 w-5 text-amber-500" />;
            case 'saving': return <TrendingUp className="h-5 w-5 text-green-500" />;
            case 'positive': return <CheckCircle2 className="h-5 w-5 text-blue-500" />;
            default: return <Lightbulb className="h-5 w-5 text-gray-500" />;
        }
    };

    const getBgColor = () => {
        switch (tip.type) {
            case 'warning': return 'bg-red-50 dark:bg-red-900/10 border-red-100 dark:border-red-800/30';
            case 'insight': return 'bg-amber-50 dark:bg-amber-900/10 border-amber-100 dark:border-amber-800/30';
            case 'saving': return 'bg-green-50 dark:bg-green-900/10 border-green-100 dark:border-green-800/30';
            case 'positive': return 'bg-blue-50 dark:bg-blue-900/10 border-blue-100 dark:border-blue-800/30';
            default: return 'bg-gray-50 dark:bg-gray-900/10';
        }
    };

    return (
        <Card className={`border shadow-sm ${getBgColor()}`}>
            <CardContent className="p-4 flex items-start gap-4">
                <div className="mt-1 flex-shrink-0">
                    {getIcon()}
                </div>
                <div className="flex-1">
                    <h4 className="font-semibold text-sm text-gray-900 dark:text-gray-100 mb-1">
                        {tip.title}
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                        {tip.description}
                    </p>
                    {tip.action && (
                        <button className="mt-2 text-xs font-medium text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 transition-colors">
                            {tip.action} →
                        </button>
                    )}
                </div>
            </CardContent>
        </Card>
    );
};

export default AITipsCard;
