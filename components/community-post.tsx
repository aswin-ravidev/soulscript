import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Heart, MessageCircle, Share2 } from "lucide-react"

interface CommunityPostProps {
  author: string
  title: string
  content: string
  likes: number
  comments: number
  time: string
  tags: string[]
}

export function CommunityPost({ author, title, content, likes, comments, time, tags }: CommunityPostProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <Avatar>
            <AvatarFallback>{author[0]}</AvatarFallback>
          </Avatar>
          <div>
            <CardTitle className="text-lg">{title}</CardTitle>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>{author}</span>
              <span>•</span>
              <span>{time}</span>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <p className="mb-4">{content}</p>
        <div className="flex flex-wrap gap-2">
          {tags.map((tag) => (
            <Badge key={tag} variant="outline">
              {tag}
            </Badge>
          ))}
        </div>
      </CardContent>
      <CardFooter className="border-t pt-4">
        <div className="flex space-x-4">
          <Button variant="ghost" size="sm" className="gap-1">
            <Heart className="h-4 w-4" />
            <span>{likes}</span>
          </Button>
          <Button variant="ghost" size="sm" className="gap-1">
            <MessageCircle className="h-4 w-4" />
            <span>{comments}</span>
          </Button>
          <Button variant="ghost" size="sm" className="gap-1">
            <Share2 className="h-4 w-4" />
            <span>Share</span>
          </Button>
        </div>
      </CardFooter>
    </Card>
  )
}

