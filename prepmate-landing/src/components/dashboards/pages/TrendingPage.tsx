import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../../ui/card";
import { Badge } from "../../ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "../../ui/avatar";

const TrendingPage: React.FC<{ user: any }> = ({ user }) => {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Trending</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <span className="text-2xl">🔥</span>
              <span>React Hooks</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Latest discussions about React Hooks and best practices
            </p>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Badge variant="secondary">#react</Badge>
                <Badge variant="secondary">#hooks</Badge>
              </div>
              <span className="text-sm text-muted-foreground">1.2k posts</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <span className="text-2xl">⚡</span>
              <span>TypeScript</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              TypeScript tips, tricks, and advanced patterns
            </p>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Badge variant="secondary">#typescript</Badge>
                <Badge variant="secondary">#javascript</Badge>
              </div>
              <span className="text-sm text-muted-foreground">856 posts</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <span className="text-2xl">🚀</span>
              <span>System Design</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              System design interview preparation and concepts
            </p>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Badge variant="secondary">#systemdesign</Badge>
                <Badge variant="secondary">#interview</Badge>
              </div>
              <span className="text-sm text-muted-foreground">543 posts</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default TrendingPage;
