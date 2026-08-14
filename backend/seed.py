from datetime import datetime, timedelta

from database import Base, SessionLocal, engine
from models import ActionItem, Meeting, Participant, Summary, TranscriptSegment


def create_meeting(
    db,
    title,
    date,
    duration,
    participants,
    transcript,
    summary_text,
    action_items,
    media_url=None,
):
    """Create a meeting together with its related sample records."""
    meeting = Meeting(title=title, date=date, duration=duration, media_url=media_url)
    db.add(meeting)
    db.flush()

    for name, email in participants:
        db.add(Participant(meeting_id=meeting.id, name=name, email=email))

    for minutes, speaker, text in transcript:
        db.add(
            TranscriptSegment(
                meeting_id=meeting.id,
                speaker=speaker,
                timestamp=date + timedelta(minutes=minutes),
                text=text,
            )
        )

    db.add(Summary(meeting_id=meeting.id, overview=summary_text))

    for item_title, assignee, completed in action_items:
        db.add(
            ActionItem(
                meeting_id=meeting.id,
                title=item_title,
                assignee=assignee,
                completed=completed,
            )
        )


def seed():
    """Populate an empty database with the demo meetings used by the app."""
    Base.metadata.create_all(bind=engine)

    db = SessionLocal()
    try:
        if db.query(Meeting).count() > 0:
            print("Meetings already exist. Skipping seed to avoid duplicates.")
            return

        create_meeting(
            db,
            title="Weekly Product Roadmap Sync",
            date=datetime(2026, 8, 10, 10, 0),
            duration=45,
            participants=[
                ("Aisha Khan", "aisha.khan@example.com"),
                ("Marcus Lee", "marcus.lee@example.com"),
                ("Priya Sharma", "priya.sharma@example.com"),
            ],
            transcript=[
                (0, "Aisha", "Good morning everyone, let's walk through the Q3 roadmap and check our progress on the mobile launch."),
                (3, "Marcus", "Mobile auth is at 80%. We still need the biometric fallback for the Android build."),
                (7, "Priya", "I can take the biometric fallback. I'll need the final API spec before Friday."),
                (12, "Aisha", "Let's also talk about the new search feature. Design handed off two mockups."),
                (18, "Priya", "I prefer the second mockup, it handles long transcripts much better."),
                (24, "Marcus", "Agreed. Search is on track for the mid-September beta, assuming no regressions."),
                (31, "Aisha", "We should decide on the notification push scope before the next sprint planning."),
                (40, "Marcus", "I'll draft a proposal and share it in Slack by tomorrow."),
            ],
            summary_text=(
                "Key discussion topics: mobile auth launch progress, biometric fallback for Android, "
                "new search feature mockups, and notification push scope. The team agreed on the second "
                "search mockup and confirmed the mid-September beta target. Mobile auth is at 80% with "
                "the biometric fallback as the remaining blocker."
            ),
            action_items=[
                ("Finish Android biometric fallback", "Priya Sharma", False),
                ("Send final API spec for biometrics", "Marcus Lee", False),
                ("Draft notification push scope proposal", "Marcus Lee", False),
                ("Share search mockup decision with design team", "Aisha Khan", True),
            ],
        )

        create_meeting(
            db,
            title="Q3 Marketing Campaign Planning",
            date=datetime(2026, 8, 11, 14, 30),
            duration=60,
            participants=[
                ("Sofia Ramirez", "sofia.ramirez@example.com"),
                ("David Chen", "david.chen@example.com"),
                ("Emily Watson", "emily.watson@example.com"),
                ("James O'Connor", "james.oconnor@example.com"),
            ],
            transcript=[
                (0, "Sofia", "Thanks for joining. Today we lock in the Q3 campaign budget and creative direction."),
                (4, "David", "The content team can support two webinars per month, not three."),
                (9, "Emily", "Paid ads spent well last quarter, especially LinkedIn. I'd push more budget there."),
                (15, "James", "I can draft the landing page copy once we agree on the core message."),
                (21, "Sofia", "The core message should be around saving time, not just features."),
                (29, "David", "Let's target mid-market companies with a case-study driven angle."),
                (38, "Emily", "We need the budget final by Thursday to book ad slots on time."),
                (47, "James", "I'll have the first copy draft ready Friday."),
                (54, "Sofia", "Great. Next week we review webinar topics and the final budget split."),
            ],
            summary_text=(
                "Key discussion topics: Q3 budget allocation, webinar capacity, paid ads performance, "
                "core campaign message, and mid-market targeting. The team aligned on a time-saving "
                "message with a case-study driven angle and agreed to shift more spend to LinkedIn paid ads."
            ),
            action_items=[
                ("Finalize Q3 campaign budget", "Sofia Ramirez", False),
                ("Draft landing page copy", "James O'Connor", False),
                ("Share webinar topics for next review", "David Chen", False),
                ("Book LinkedIn ad slots", "Emily Watson", True),
            ],
        )

        create_meeting(
            db,
            title="Customer Onboarding Retrospective",
            date=datetime(2026, 8, 12, 11, 0),
            duration=30,
            participants=[
                ("Nina Patel", "nina.patel@example.com"),
                ("Tom Baker", "tom.baker@example.com"),
            ],
            transcript=[
                (0, "Nina", "Let's reflect on the new onboarding flow and what went well or badly."),
                (4, "Tom", "Activation improved to 68%, up from 55%. The checklist step made a big difference."),
                (9, "Nina", "Support tickets about setup dropped too, but people still ask about API keys."),
                (14, "Tom", "We should surface the API key section earlier in the checklist."),
                (19, "Nina", "Also, the welcome email timing feels too late for some users."),
                (25, "Tom", "Let's test sending it one day earlier and measure the impact."),
            ],
            summary_text=(
                "Key discussion topics: onboarding activation rate, support ticket trends, API key "
                "discoverability, and welcome email timing. Activation improved from 55% to 68%. "
                "The team agreed to surface API keys earlier and run an A/B test on the welcome email."
            ),
            action_items=[
                ("Move API key section earlier in onboarding checklist", "Tom Baker", False),
                ("Run welcome email timing A/B test", "Nina Patel", False),
                ("Track activation rate after checklist change", "Tom Baker", True),
                ("Follow up on support ticket root causes", "Nina Patel", True),
            ],
        )

        create_meeting(
            db,
            title="Sample Meeting Recording",
            date=datetime(2026, 8, 13, 16, 0),
            duration=43,
            participants=[
                ("Suraj Joshi", "suraj@example.com"),
                ("Rahul Verma", "rahul@example.com"),
            ],
            transcript=[
                (0, "Suraj", "Alright, let's start the recording. Welcome to today's catch-up on the mobile app release."),
                (90, "Rahul", "Build 2.4 is with QA now. So far no critical blockers, just a couple of UI nits."),
                (240, "Suraj", "Good. Can we confirm the notification permission prompt is fixed on Android 13?"),
                (420, "Rahul", "Yes, that landed yesterday and the fix is verified on a physical device."),
                (600, "Suraj", "What about the crash on app start we saw in the last release candidate?"),
                (780, "Rahul", "That was a race condition in the session store. The patch is in this build."),
                (960, "Suraj", "Great. Store review timeline — when do we expect the release to go live?"),
                (1140, "Rahul", "If QA passes by Thursday, we can submit Friday and expect approval over the weekend."),
                (1320, "Suraj", "Let's also plan a quick beta invite to the top feedback users before the full rollout."),
                (1500, "Rahul", "I'll prepare the invite list and draft the release notes before Friday."),
                (1680, "Suraj", "Sounds good. Anything else blocking the launch?"),
                (1800, "Rahul", "Just the analytics dashboard cutover, but that is on track and low risk."),
                (1980, "Suraj", "Perfect, let's reconvene on Thursday after QA signs off."),
            ],
            summary_text=(
                "Key discussion topics: QA status of build 2.4, notification permission fix on Android 13, "
                "app-start crash fix, store review timeline, beta invites, and analytics dashboard cutover. "
                "The build is in QA with no critical blockers. The team targets a Friday store submission "
                "and a beta invite to top feedback users before the full rollout."
            ),
            action_items=[
                ("Prepare beta invite list", "Rahul Verma", False),
                ("Draft release notes", "Rahul Verma", False),
                ("Follow up on analytics dashboard cutover", "Suraj Joshi", False),
                ("Submit build to the store on Friday", "Suraj Joshi", True),
            ],
            media_url="/media/video.mp4",
        )

        db.commit()
        print("Seeded 4 meetings with participants, transcripts, summaries, and action items.")

    finally:
        db.close()


if __name__ == "__main__":
    seed()
