import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CommunityPost } from "@/components/community-post"

export default function CommunityPage() {
  return (
    <div className="container mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Community</h1>
        <p className="text-muted-foreground">Connect with others on their mental health journey</p>
      </div>

      <div className="mb-6">
        <Card>
          <CardHeader>
            <CardTitle>Community Guidelines</CardTitle>
            <CardDescription>
              Our community is a safe space for everyone. Please be respectful and supportive.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="list-disc pl-5 space-y-2 text-sm">
              <li>Be kind and respectful to all members</li>
              <li>Maintain confidentiality and privacy</li>
              <li>Avoid giving medical advice</li>
              <li>Focus on support rather than diagnosis</li>
              <li>Report any concerning content to moderators</li>
            </ul>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="popular" className="space-y-6">
        <div className="flex justify-between items-center">
          <TabsList>
            <TabsTrigger value="popular">Popular</TabsTrigger>
            <TabsTrigger value="recent">Recent</TabsTrigger>
            <TabsTrigger value="following">Following</TabsTrigger>
          </TabsList>
          <Button>Share Your Story</Button>
        </div>

        <TabsContent value="popular" className="space-y-6">
          <CommunityPost
            author="Anonymous"
            title="Finding peace after anxiety"
            content="After struggling with anxiety for years, I finally found techniques that work for me. Mindfulness meditation and regular journaling have been game-changers. I wanted to share my journey in case it helps anyone else going through similar challenges."
            likes={42}
            comments={12}
            time="2 days ago"
            tags={["Anxiety", "Recovery", "Mindfulness"]}
          />

          <CommunityPost
            author="HealingHeart"
            title="Small victories matter"
            content="Today I managed to go grocery shopping despite my social anxiety. It might seem small to others, but for me it's a huge win. I'm learning to celebrate these moments instead of focusing on what I still can't do."
            likes={36}
            comments={8}
            time="3 days ago"
            tags={["Social Anxiety", "Progress", "Self-care"]}
          />

          <CommunityPost
            author="GrowthMindset"
            title="How journaling changed my perspective"
            content="I was skeptical about journaling at first, but after three months of consistent practice, I've noticed significant changes in how I process emotions. Writing things down helps me see patterns I couldn't recognize before. Has anyone else experienced similar benefits?"
            likes={29}
            comments={15}
            time="1 week ago"
            tags={["Journaling", "Emotional Intelligence", "Habits"]}
          />
        </TabsContent>

        <TabsContent value="recent">
          <div className="flex items-center justify-center p-12">
            <p className="text-muted-foreground">Recent posts would appear here</p>
          </div>
        </TabsContent>

        <TabsContent value="following">
          <div className="flex items-center justify-center p-12">
            <p className="text-muted-foreground">Posts from people you follow would appear here</p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

