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
            case 'warning': return 'bg-red-500/10 dark:bg-red-900/20 border-red-500/20';
            case 'insight': return 'bg-amber-500/10 dark:bg-amber-900/20 border-amber-500/20';
            case 'saving': return 'bg-green-500/10 dark:bg-green-900/20 border-green-500/20';
            case 'positive': return 'bg-blue-500/10 dark:bg-blue-900/20 border-blue-500/20';
            default: return 'bg-card/40 dark:bg-card/40 border-border/50';
        }
    };

    return (
        <Card className={`border shadow-lg backdrop-blur-xl transition-all duration-300 hover:shadow-xl hover:-translate-y-1 ${getBgColor()}`}>
            <CardContent className="p-5 flex items-start gap-4 h-full">
                <div className="mt-1 flex-shrink-0 p-2 rounded-full bg-background/50 shadow-sm border border-border/30">
                    {getIcon()}
                </div>
                <div className="flex-1 flex flex-col justify-between h-full">
                    <div>
                        <h4 className="font-bold text-sm text-foreground mb-1.5 leading-snug">
                            {tip.title}
                        </h4>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                            {tip.description}
                        </p>
                    </div>
                    {tip.action && (
                        <button className="mt-4 text-xs font-semibold text-primary hover:text-primary/80 transition-colors flex items-center gap-1 w-fit group">
                            {tip.action}
                            <span className="transition-transform group-hover:translate-x-1">→</span>
                        </button>
                    )}
                </div>
            </CardContent>
        </Card>
    );
};

export default AITipsCard;
