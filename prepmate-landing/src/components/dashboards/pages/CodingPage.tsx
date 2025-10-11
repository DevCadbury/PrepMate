import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../../ui/card";
import { Button } from "../../ui/button";
import { Badge } from "../../ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "../../ui/avatar";

const CodingPage: React.FC<{ user: any }> = ({ user }) => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Coding</h1>
        <Button>Start Challenge</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Two Sum</CardTitle>
              <Badge variant="secondary">Easy</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Given an array of integers nums and an integer target, return
              indices of the two numbers such that they add up to target.
            </p>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Badge variant="outline">Array</Badge>
                <Badge variant="outline">Hash Table</Badge>
              </div>
              <span className="text-sm text-muted-foreground">
                85% success rate
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Valid Parentheses</CardTitle>
              <Badge variant="secondary">Easy</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Given a string s containing just the characters '(', ')', '{", "}
              ', '[' and ']', determine if the input string is valid.
            </p>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Badge variant="outline">Stack</Badge>
                <Badge variant="outline">String</Badge>
              </div>
              <span className="text-sm text-muted-foreground">
                92% success rate
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Reverse Linked List</CardTitle>
              <Badge variant="destructive">Medium</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Given the head of a singly linked list, reverse the list, and
              return the reversed list.
            </p>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Badge variant="outline">Linked List</Badge>
                <Badge variant="outline">Recursion</Badge>
              </div>
              <span className="text-sm text-muted-foreground">
                78% success rate
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Submissions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center space-x-3">
                <Avatar>
                  <AvatarImage src={user?.avatar} />
                  <AvatarFallback>
                    {user?.name?.charAt(0) || "U"}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">Two Sum</p>
                  <p className="text-sm text-muted-foreground">
                    JavaScript • 2 hours ago
                  </p>
                </div>
              </div>
              <Badge variant="default">Accepted</Badge>
            </div>

            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center space-x-3">
                <Avatar>
                  <AvatarImage src={user?.avatar} />
                  <AvatarFallback>
                    {user?.name?.charAt(0) || "U"}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">Valid Parentheses</p>
                  <p className="text-sm text-muted-foreground">
                    Python • 1 day ago
                  </p>
                </div>
              </div>
              <Badge variant="default">Accepted</Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CodingPage;
