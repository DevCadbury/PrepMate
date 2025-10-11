import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../../ui/card";
import { Button } from "../../ui/button";
import { Badge } from "../../ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "../../ui/avatar";

const QuestionsPage: React.FC<{ user: any }> = ({ user }) => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Questions</h1>
        <Button>Ask Question</Button>
      </div>

      <div className="space-y-4">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Avatar>
                  <AvatarImage src="https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face" />
                  <AvatarFallback>SW</AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">Sarah Wilson</p>
                  <p className="text-sm text-muted-foreground">2 hours ago</p>
                </div>
              </div>
              <Badge variant="secondary">JavaScript</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <h3 className="font-semibold mb-2">
              How do closures work in JavaScript?
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              I'm trying to understand closures but I'm getting confused. Can
              someone explain with a simple example?
            </p>
            <div className="flex items-center space-x-4">
              <Button variant="ghost" size="sm">
                💬 8 answers
              </Button>
              <Button variant="ghost" size="sm">
                👁️ 124 views
              </Button>
              <Button variant="ghost" size="sm">
                👍 12 votes
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Avatar>
                  <AvatarImage src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face" />
                  <AvatarFallback>MC</AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">Mike Chen</p>
                  <p className="text-sm text-muted-foreground">5 hours ago</p>
                </div>
              </div>
              <Badge variant="secondary">React</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <h3 className="font-semibold mb-2">
              Best practices for state management in React?
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              I'm building a large React app and need advice on state
              management. Should I use Redux, Context API, or something else?
            </p>
            <div className="flex items-center space-x-4">
              <Button variant="ghost" size="sm">
                💬 15 answers
              </Button>
              <Button variant="ghost" size="sm">
                👁️ 89 views
              </Button>
              <Button variant="ghost" size="sm">
                👍 23 votes
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default QuestionsPage;
