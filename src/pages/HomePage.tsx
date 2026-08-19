import React, { useState, useEffect, useRef } from 'react';
import {
  FileText,
  Stethoscope,
  Pill,
  Calculator,
  MessageSquare,
  Calendar,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Lock,
  HeartPulse,
  Clock,
  Star,
  Send,
  MessageCircle,
  HelpCircle,
  Mail,
  Phone,
  Headphones,
  Check,
  AlertCircle,
  Sparkles,
  ChevronRight,
  Upload,
  Cpu,
  BookOpen,
  Apple,
  Activity,
  X,
  UserPlus,
  LogIn
} from 'lucide-react';
import { DisclaimerBanner } from '../components/DisclaimerBanner.js';
import { Review, FeedbackType } from '../types.js';
import { useAuth } from '../context/AuthContext.js';

interface HomePageProps {
  onNavigate: (page: string) => void;
}

export const HomePage: React.FC<HomePageProps> = ({ onNavigate }) => {
  const { user } = useAuth();
  const [showLoginRequiredModal, setShowLoginRequiredModal] = useState<boolean>(false);

  // Reviews state (real database fetch)
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loadingReviews, setLoadingReviews] = useState<boolean>(true);
  const [showReviewModal, setShowReviewModal] = useState<boolean>(false);
  
  // Review form state
  const [reviewName, setReviewName] = useState('');
  const [reviewEmail, setReviewEmail] = useState('');
  const [reviewRating, setReviewRating] = useState<number>(5);
  const [reviewText, setReviewText] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewSuccess, setReviewSuccess] = useState<string | null>(null);
  const [reviewError, setReviewError] = useState<string | null>(null);

  // Feedback form state
  const [fbName, setFbName] = useState('');
  const [fbEmail, setFbEmail] = useState('');
  const [fbType, setFbType] = useState<FeedbackType>('Website Experience');
  const [fbMessage, setFbMessage] = useState('');
  const [submittingFb, setSubmittingFb] = useState(false);
  const [fbSuccess, setFbSuccess] = useState<string | null>(null);
  const [fbError, setFbError] = useState<string | null>(null);

  // Contact form state
  const [contactName, setContactName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactSubject, setContactSubject] = useState('');
  const [contactMessage, setContactMessage] = useState('');
  const [submittingContact, setSubmittingContact] = useState(false);
  const [contactSuccess, setContactSuccess] = useState<string | null>(null);
  const [contactError, setContactError] = useState<string | null>(null);

  // Fetch real reviews from backend on mount
  const fetchReviews = async () => {
    try {
      setLoadingReviews(true);
      const res = await fetch('/api/reviews');
      if (res.ok) {
        const data = await res.json();
        setReviews(data.reviews || []);
      }
    } catch (err) {
      console.error('Error fetching reviews:', err);
    } finally {
      setLoadingReviews(false);
    }
  };

  // Video refs to guarantee autoplay and diagnostics across desktop & mobile
  const heroVideoRef = useRef<HTMLVideoElement | null>(null);
  const ctaVideoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    fetchReviews();

    const video = heroVideoRef.current;
    if (!video) return;

    const videoUrl = '/assets/1000240377.mp4';
    console.log('[Hero Video] Target video URL:', videoUrl);

    // Ensure audio tracks are strictly disabled so autoplay policy is satisfied on mobile iOS & Android
    video.muted = true;
    video.defaultMuted = true;
    video.playsInline = true;

    // Comprehensive diagnostics listeners
    const onLoadedMetadata = () => {
      console.log('[Hero Video] loadedmetadata - Duration:', video.duration, 'Resolution:', video.videoWidth, 'x', video.videoHeight);
      attemptPlay();
    };

    const onCanPlay = () => {
      console.log('[Hero Video] canplay - ReadyState:', video.readyState);
      attemptPlay();
    };

    const onPlaying = () => {
      console.log('[Hero Video] playing - Video is actively rendering frames on screen');
    };

    const onWaiting = () => {
      console.log('[Hero Video] waiting - Buffering stream');
    };

    const onStalled = () => {
      console.log('[Hero Video] stalled - Network stalled');
    };

    const onError = (e: Event) => {
      console.warn('[Hero Video] error - Video stream error encountered:', video.error?.message || video.error?.code || 'Unknown', e);
      // Requirement: Do NOT hide, replace, pause, or remove the video because of an error
    };

    const attemptPlay = () => {
      if (!video) return;
      video.muted = true;
      const playPromise = video.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            console.log('[Hero Video] play() resolved successfully - continuous playback running');
          })
          .catch((err) => {
            console.warn('[Hero Video] play() rejected (browser policy restriction):', err?.message || err);
            // Autoplay initially blocked by browser policy - register interaction fallback
            attachInteractionListeners();
          });
      }
    };

    let interactionAttached = false;
    const handleInteraction = () => {
      if (!video) return;
      console.log('[Hero Video] Retrying play() on user interaction or visibility change');
      video.muted = true;
      video.play()
        .then(() => {
          console.log('[Hero Video] Playback resumed successfully on interaction');
          removeInteractionListeners();
        })
        .catch((err) => {
          console.warn('[Hero Video] Interaction play() rejection:', err?.message || err);
        });
    };

    const attachInteractionListeners = () => {
      if (interactionAttached) return;
      interactionAttached = true;
      window.addEventListener('touchstart', handleInteraction, { passive: true, once: true });
      window.addEventListener('pointerdown', handleInteraction, { passive: true, once: true });
      window.addEventListener('click', handleInteraction, { passive: true, once: true });
      window.addEventListener('scroll', handleInteraction, { passive: true, once: true });
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') {
          handleInteraction();
        }
      });
    };

    const removeInteractionListeners = () => {
      interactionAttached = false;
      window.removeEventListener('touchstart', handleInteraction);
      window.removeEventListener('pointerdown', handleInteraction);
      window.removeEventListener('click', handleInteraction);
      window.removeEventListener('scroll', handleInteraction);
    };

    video.addEventListener('loadedmetadata', onLoadedMetadata);
    video.addEventListener('canplay', onCanPlay);
    video.addEventListener('playing', onPlaying);
    video.addEventListener('waiting', onWaiting);
    video.addEventListener('stalled', onStalled);
    video.addEventListener('error', onError);

    // Initial play trigger
    attemptPlay();

    // CTA video autoplay helper
    const ctaVideo = ctaVideoRef.current;
    if (ctaVideo) {
      ctaVideo.muted = true;
      ctaVideo.defaultMuted = true;
      ctaVideo.playsInline = true;
      ctaVideo.play().catch(() => {});
    }

    return () => {
      video.removeEventListener('loadedmetadata', onLoadedMetadata);
      video.removeEventListener('canplay', onCanPlay);
      video.removeEventListener('playing', onPlaying);
      video.removeEventListener('waiting', onWaiting);
      video.removeEventListener('stalled', onStalled);
      video.removeEventListener('error', onError);
      removeInteractionListeners();
    };
  }, []);

  // Handle real review submission
  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewName.trim()) {
      setReviewError('Please enter your name.');
      return;
    }
    if (!reviewRating || reviewRating < 1 || reviewRating > 5) {
      setReviewError('Please select a star rating (1 to 5).');
      return;
    }
    if (!reviewText.trim()) {
      setReviewError('Please enter your review text.');
      return;
    }

    try {
      setSubmittingReview(true);
      setReviewError(null);
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: reviewName.trim(),
          email: reviewEmail.trim() || undefined,
          rating: reviewRating,
          review: reviewText.trim()
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to submit review.');
      }

      setReviewSuccess('Thank you! Your review has been submitted successfully.');
      setReviewName('');
      setReviewEmail('');
      setReviewRating(5);
      setReviewText('');
      await fetchReviews();
      setTimeout(() => {
        setReviewSuccess(null);
        setShowReviewModal(false);
      }, 2000);
    } catch (err: any) {
      setReviewError(err.message || 'Error submitting review.');
    } finally {
      setSubmittingReview(false);
    }
  };

  // Handle feedback submission
  const handleFeedbackSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fbName.trim()) {
      setFbError('Please enter your name.');
      return;
    }
    if (!fbMessage.trim()) {
      setFbError('Please enter your feedback message.');
      return;
    }

    try {
      setSubmittingFb(true);
      setFbError(null);
      const res = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: fbName.trim(),
          email: fbEmail.trim() || undefined,
          feedbackType: fbType,
          message: fbMessage.trim()
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to send feedback.');
      }

      setFbSuccess('Thank you for your feedback. We appreciate your input in improving MediVerse.');
      setFbName('');
      setFbEmail('');
      setFbMessage('');
      setTimeout(() => {
        setFbSuccess(null);
      }, 5000);
    } catch (err: any) {
      setFbError(err.message || 'Error submitting feedback.');
    } finally {
      setSubmittingFb(false);
    }
  };

  // Handle contact form submission
  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactName.trim()) {
      setContactError('Please enter your full name.');
      return;
    }
    if (!contactEmail.trim() || !contactEmail.includes('@')) {
      setContactError('Please enter a valid email address.');
      return;
    }
    if (!contactMessage.trim()) {
      setContactError('Please enter your message.');
      return;
    }

    try {
      setSubmittingContact(true);
      setContactError(null);
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: contactName.trim(),
          email: contactEmail.trim(),
          subject: contactSubject.trim() || undefined,
          message: contactMessage.trim()
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to send message.');
      }

      setContactSuccess('Message sent successfully. Thank you for contacting MediVerse.');
      setContactName('');
      setContactEmail('');
      setContactSubject('');
      setContactMessage('');
      setTimeout(() => {
        setContactSuccess(null);
      }, 6000);
    } catch (err: any) {
      setContactError(err.message || 'Error sending message.');
    } finally {
      setSubmittingContact(false);
    }
  };

  // Service suite cards (2-column layout requested)
  const serviceCards = [
    {
      id: 'lab-report',
      title: 'AI Lab Report Analysis',
      description: 'Analyze uploaded laboratory reports and explain abnormal findings in simple language.',
      icon: FileText,
      tag: 'OCR & Analysis'
    },
    {
      id: 'symptom-checker',
      title: 'Symptom Checker',
      description: 'Enter symptoms and receive general educational information, warning signs and guidance on when to seek medical care.',
      icon: Stethoscope,
      tag: 'Triage Guidance'
    },
    {
      id: 'medicine-info',
      title: 'Medicine Information',
      description: 'Search medicines and view reliable general information, precautions and common side effects.',
      icon: Pill,
      tag: 'Clinical Reference'
    },
    {
      id: 'bmi',
      title: 'BMI Calculator',
      description: 'Calculate BMI and understand the general BMI category.',
      icon: Calculator,
      tag: 'Body Metrics'
    },
    {
      id: 'ai-chat',
      title: 'AI Health Chat',
      description: 'Ask health-related questions in simple language.',
      icon: MessageSquare,
      tag: 'Interactive AI'
    },
    {
      id: 'appointment',
      title: 'Doctor Appointment',
      description: 'Request and manage appointments.',
      icon: Calendar,
      tag: 'Specialist Booking'
    },
    {
      id: 'health-records',
      title: 'My Health Records',
      description: 'Access your centralized patient health record: reports archive, longitudinal comparisons, digital prescriptions, and health history.',
      icon: HeartPulse,
      tag: 'Protected Health Portal'
    }
  ];

  const handleServiceCardClick = (cardId: string) => {
    if (cardId === 'health-records') {
      if (!user) {
        setShowLoginRequiredModal(true);
        return;
      }
      onNavigate(user.role === 'doctor' ? 'doctor-dashboard' : 'patient-dashboard');
      return;
    }
    onNavigate(cardId);
  };

  // 5 How MediVerse Works Steps
  const workflowSteps = [
    {
      num: '01',
      title: 'Upload',
      desc: 'Upload your medical report or enter your health information.',
      icon: Upload
    },
    {
      num: '02',
      title: 'AI Analysis',
      desc: 'AI processes the available information.',
      icon: Cpu
    },
    {
      num: '03',
      title: 'Understand',
      desc: 'View important findings and explanations in simple language.',
      icon: BookOpen
    },
    {
      num: '04',
      title: 'Guidance',
      desc: 'Get general food, lifestyle and doctor-discussion guidance.',
      icon: Apple
    },
    {
      num: '05',
      title: 'Take Action',
      desc: 'Use the information to prepare for a conversation with a qualified healthcare professional.',
      icon: Activity
    }
  ];

  return (
    <div id="home-page" className="min-h-screen bg-[#f0f6fc]">
      <DisclaimerBanner compact />

      {/* 2. HOMEPAGE HERO WITH BACKGROUND VIDEO */}
      <section className="relative overflow-hidden bg-slate-950 text-white py-20 sm:py-28 min-h-[560px] sm:min-h-[620px] flex items-center justify-center">
        
        {/* Background Video: Layer 0 */}
        <video
          ref={heroVideoRef}
          src="/assets/1000240377.mp4"
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
          aria-hidden="true"
          className="absolute inset-0 w-full h-full object-cover z-0 pointer-events-none"
          style={{ objectFit: 'cover', width: '100%', height: '100%' }}
        >
          <source src="/assets/1000240377.mp4" type="video/mp4" />
        </video>

        {/* Subtle transparent overlay: Layer 1 (allowing video frames to be vividly visible while keeping text legible) */}
        <div className="absolute inset-0 z-10 bg-slate-950/20 pointer-events-none" />

        {/* Hero Content: Layer 2 */}
        <div className="relative z-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="max-w-3xl mx-auto space-y-6">
            
            {/* Small Badge */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-500/25 border border-blue-400/40 text-blue-200 text-xs font-semibold tracking-wider uppercase backdrop-blur-md shadow-xs">
              <HeartPulse className="w-4 h-4 text-blue-400" />
              <span>AI POWERED HEALTHCARE PLATFORM</span>
            </div>

            {/* Main Heading */}
            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold text-white tracking-tight leading-tight drop-shadow-md">
              Understand Your Health Better <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-300 via-sky-200 to-white">With AI</span>
            </h1>

            {/* Supporting Text */}
            <p className="text-base sm:text-xl text-blue-100/90 font-normal leading-relaxed max-w-2xl mx-auto drop-shadow-xs">
              Analyze medical reports, understand symptoms, explore medicine information and get personalized health guidance.
            </p>

            {/* Buttons */}
            <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
              <button
                id="hero-cta-analyze-lab-report"
                onClick={() => onNavigate('lab-report')}
                className="w-full sm:w-auto px-7 py-3.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold shadow-xl shadow-blue-950/60 flex items-center justify-center gap-2.5 text-base transition-all transform hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
              >
                <FileText className="w-5 h-5" />
                <span>Analyze Lab Report</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                id="hero-cta-talk-to-ai"
                onClick={() => onNavigate('ai-chat')}
                className="w-full sm:w-auto px-7 py-3.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold border border-white/20 shadow-xs flex items-center justify-center gap-2.5 text-base backdrop-blur-md transition-all cursor-pointer"
              >
                <MessageSquare className="w-5 h-5 text-sky-300" />
                <span>Talk to AI</span>
              </button>
            </div>

          </div>
        </div>
      </section>

      {/* 3. TRUST / FEATURE STRIP */}
      <section className="bg-[#08152e] text-blue-100 border-y border-blue-900/60 py-4 sm:py-5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center sm:text-left">
            
            <div className="flex items-center justify-center sm:justify-start gap-2.5 text-xs sm:text-sm font-medium">
              <div className="w-7 h-7 rounded-lg bg-blue-950/80 border border-blue-800/40 text-blue-300 flex items-center justify-center shrink-0">
                <FileText className="w-4 h-4" />
              </div>
              <span className="text-blue-100">Real User Documents</span>
            </div>

            <div className="flex items-center justify-center sm:justify-start gap-2.5 text-xs sm:text-sm font-medium">
              <div className="w-7 h-7 rounded-lg bg-blue-950/80 border border-blue-800/40 text-blue-300 flex items-center justify-center shrink-0">
                <Sparkles className="w-4 h-4" />
              </div>
              <span className="text-blue-100">AI-Powered Analysis</span>
            </div>

            <div className="flex items-center justify-center sm:justify-start gap-2.5 text-xs sm:text-sm font-medium">
              <div className="w-7 h-7 rounded-lg bg-blue-950/80 border border-blue-800/40 text-blue-300 flex items-center justify-center shrink-0">
                <Lock className="w-4 h-4" />
              </div>
              <span className="text-blue-100">Privacy Focused</span>
            </div>

            <div className="flex items-center justify-center sm:justify-start gap-2.5 text-xs sm:text-sm font-medium">
              <div className="w-7 h-7 rounded-lg bg-blue-950/80 border border-blue-800/40 text-blue-300 flex items-center justify-center shrink-0">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <span className="text-blue-100">Educational Health Guidance</span>
            </div>

          </div>
        </div>
      </section>

      {/* 4. SERVICES SECTION (Main background: very light blue) */}
      <section id="services-section" className="py-18 sm:py-24 bg-[#f0f6fc] border-b border-blue-100/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-2xl mx-auto mb-14 space-y-3">
            <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
              Complete Healthcare Intelligence Suite
            </h2>
            <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
              Simple AI-powered tools to help you understand your health information.
            </p>
          </div>

          {/* 2-Column Responsive Card Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8 max-w-5xl mx-auto">
            {serviceCards.map(card => {
              const Icon = card.icon;
              return (
                <div
                  key={card.id}
                  id={`service-card-${card.id}`}
                  className="bg-white rounded-3xl p-6 sm:p-7 border border-blue-100/90 shadow-sm hover:shadow-lg hover:border-blue-300 transition-all flex flex-col justify-between group"
                >
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-100/90 text-blue-600 flex items-center justify-center shadow-xs">
                        <Icon className="w-6 h-6 text-blue-600" />
                      </div>
                      <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-100/80">
                        {card.tag}
                      </span>
                    </div>

                    <div>
                      <h3 className="text-xl font-bold text-slate-900 mb-2">
                        {card.title}
                      </h3>
                      <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
                        {card.description}
                      </p>
                    </div>
                  </div>

                  <div className="pt-6 mt-4 border-t border-slate-100">
                    <button
                      id={`open-tool-btn-${card.id}`}
                      onClick={() => handleServiceCardClick(card.id)}
                      className="w-full py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold text-sm shadow-md shadow-blue-600/20 hover:shadow-lg hover:shadow-blue-600/30 transition-all transform hover:-translate-y-0.5 active:translate-y-0 flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <span>{card.id === 'health-records' ? 'Access Records →' : 'Open Tool →'}</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

        </div>
      </section>

      {/* 5. HOW MEDIVERSE WORKS (Dark/Blue Healthcare Section) */}
      <section className="py-18 sm:py-24 bg-gradient-to-b from-[#081938] via-[#0d2757] to-[#0a1f46] text-white border-b border-blue-900/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 border border-blue-400/30 text-blue-300 text-xs font-semibold uppercase tracking-wider">
              <span>Transparent AI Workflow</span>
            </div>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
              How MediVerse Works
            </h2>
            <p className="text-blue-100/80 text-sm sm:text-base leading-relaxed">
              A 5-step educational flow that transforms raw clinical data into clear health literacy.
            </p>
          </div>

          {/* 5 Steps Layout */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 lg:gap-5">
            {workflowSteps.map((step, idx) => {
              const StepIcon = step.icon;
              return (
                <div
                  key={step.num}
                  className="bg-[#10244c]/85 rounded-2xl p-6 border border-blue-800/60 hover:border-blue-400/60 shadow-md backdrop-blur-xs flex flex-col justify-between space-y-4 transition-all"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xl font-extrabold text-blue-400 tracking-tight">
                        {step.num}
                      </span>
                      <div className="w-8 h-8 rounded-lg bg-blue-900/80 border border-blue-700/50 text-blue-300 flex items-center justify-center">
                        <StepIcon className="w-4 h-4" />
                      </div>
                    </div>
                    <h3 className="text-lg font-bold text-white">
                      {step.title}
                    </h3>
                    <p className="text-xs sm:text-sm text-blue-100/75 leading-relaxed">
                      {step.desc}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-12 text-center">
            <p className="text-xs sm:text-sm text-blue-200/60 max-w-xl mx-auto">
              Educational notice: MediVerse information is generated to prepare you for informed discussions with licensed healthcare providers. It does not provide medical diagnoses or prescriptions.
            </p>
          </div>

        </div>
      </section>      {/* 6. WHAT OUR USERS SAY — REVIEWS SECTION (Alternate deeper light blue) */}
      <section id="reviews-section" className="py-20 sm:py-28 bg-[#e8f1fb] border-t border-b border-blue-200/70">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12 sm:mb-16">
            <div className="space-y-3 max-w-2xl">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-100 border border-blue-200 text-blue-800 text-xs font-semibold tracking-wide uppercase">
                <Star className="w-3.5 h-3.5 fill-blue-600 text-blue-600" />
                <span>Verified Community Reviews</span>
              </div>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 tracking-tight leading-tight">
                What Our Users Say
              </h2>
              <p className="text-slate-600 text-base sm:text-lg leading-relaxed">
                Your experience helps us make MediVerse better.
              </p>
            </div>

            <button
              id="leave-a-review-btn"
              onClick={() => setShowReviewModal(true)}
              className="inline-flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold text-sm shadow-md shadow-blue-600/20 hover:shadow-lg hover:shadow-blue-600/30 transition-all transform hover:-translate-y-0.5 active:translate-y-0 self-start md:self-auto cursor-pointer"
            >
              <MessageSquare className="w-4 h-4 text-blue-100" />
              <span>Leave a Review</span>
            </button>
          </div>

          {/* Dynamic Reviews Display */}
          {loadingReviews ? (
            <div className="py-16 text-center text-slate-500 text-sm flex flex-col items-center justify-center gap-3">
              <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin" />
              <span>Loading verified reviews...</span>
            </div>
          ) : reviews.length === 0 ? (
            <div className="bg-white rounded-3xl p-8 sm:p-14 text-center border border-blue-100/90 shadow-md max-w-xl mx-auto space-y-5">
              <div className="w-16 h-16 rounded-2xl bg-blue-50 border border-blue-100 text-blue-600 mx-auto flex items-center justify-center shadow-xs">
                <Star className="w-8 h-8 text-blue-600 fill-blue-100" />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-bold text-slate-900">
                  Be the first to share your MediVerse experience.
                </h3>
                <p className="text-sm text-slate-600 max-w-md mx-auto leading-relaxed">
                  Help fellow patients and health-conscious users by sharing how MediVerse assisted with your lab reports, symptoms, or medications.
                </p>
              </div>
              <div className="pt-2">
                <button
                  onClick={() => setShowReviewModal(true)}
                  className="px-7 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm shadow-md shadow-blue-600/20 hover:shadow-lg transition-all cursor-pointer inline-flex items-center gap-2"
                >
                  <MessageSquare className="w-4 h-4" />
                  <span>Write the First Review</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
              {reviews.map(rev => (
                <div
                  key={rev.id}
                  className="bg-white rounded-3xl p-6 sm:p-7 border border-blue-100 shadow-sm hover:shadow-xl hover:border-blue-300/80 hover:-translate-y-1.5 transition-all duration-300 flex flex-col justify-between space-y-5"
                >
                  <div className="space-y-3.5">
                    {/* Stars and Rating */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1">
                        {[1, 2, 3, 4, 5].map(starIndex => (
                          <Star
                            key={starIndex}
                            className={`w-4 h-4 ${
                              starIndex <= rev.rating
                                ? 'text-amber-400 fill-amber-400'
                                : 'text-slate-200 fill-slate-100'
                            }`}
                          />
                        ))}
                      </div>
                      <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200/60">
                        {rev.rating}.0 ★
                      </span>
                    </div>

                    {/* Review text */}
                    <p className="text-sm sm:text-base text-slate-700 leading-relaxed italic">
                      "{rev.review}"
                    </p>
                  </div>

                  {/* Author Card Footer */}
                  <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-white font-bold text-xs flex items-center justify-center shadow-xs">
                        {rev.name ? rev.name.charAt(0).toUpperCase() : 'U'}
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-900 text-sm leading-none">
                          {rev.name}
                        </h4>
                        <span className="text-[11px] text-emerald-600 font-medium inline-flex items-center gap-1 mt-0.5">
                          <CheckCircle2 className="w-3 h-3" />
                          Verified User
                        </span>
                      </div>
                    </div>
                    <span className="text-xs text-slate-400 font-medium">
                      {new Date(rev.date).toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}

        </div>
      </section>

      {/* Review Modal Form */}
      {showReviewModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-blue-100 animate-fadeIn">
            
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-5">
              <div>
                <h3 className="text-xl font-bold text-slate-900 tracking-tight">Leave a Review</h3>
                <p className="text-xs text-slate-500 mt-0.5">Share your genuine experience with MediVerse</p>
              </div>
              <button
                onClick={() => setShowReviewModal(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>

            {reviewSuccess ? (
              <div className="py-8 text-center space-y-3 bg-emerald-50/70 rounded-2xl border border-emerald-200">
                <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 mx-auto flex items-center justify-center shadow-xs">
                  <Check className="w-6 h-6" />
                </div>
                <p className="text-emerald-900 font-bold text-base">{reviewSuccess}</p>
              </div>
            ) : (
              <form onSubmit={handleReviewSubmit} className="space-y-4">
                {reviewError && (
                  <div className="p-3.5 rounded-xl bg-red-50 text-red-700 text-xs border border-red-200 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{reviewError}</span>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Your Name <span className="text-blue-600">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={reviewName}
                    onChange={e => setReviewName(e.target.value)}
                    placeholder="e.g., Alex Johnson"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 bg-slate-50/50 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Email (Optional)
                  </label>
                  <input
                    type="email"
                    value={reviewEmail}
                    onChange={e => setReviewEmail(e.target.value)}
                    placeholder="alex@example.com (will not be published)"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 bg-slate-50/50 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Rating (1 to 5 Stars) <span className="text-blue-600">*</span>
                  </label>
                  <div className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                    {[1, 2, 3, 4, 5].map(starNum => (
                      <button
                        type="button"
                        key={starNum}
                        onClick={() => setReviewRating(starNum)}
                        className="p-1 focus:outline-none cursor-pointer transform hover:scale-110 transition-transform"
                      >
                        <Star
                          className={`w-6 h-6 transition-colors ${
                            starNum <= reviewRating
                              ? 'text-amber-400 fill-amber-400'
                              : 'text-slate-300 hover:text-amber-200'
                          }`}
                        />
                      </button>
                    ))}
                    <span className="text-xs text-slate-700 ml-2 font-semibold">
                      {reviewRating} of 5 stars
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Review / Feedback <span className="text-blue-600">*</span>
                  </label>
                  <textarea
                    required
                    rows={4}
                    value={reviewText}
                    onChange={e => setReviewText(e.target.value)}
                    placeholder="Describe how MediVerse helped you understand your lab reports or health questions..."
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 bg-slate-50/50 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white resize-none transition-all"
                  />
                </div>

                <div className="pt-2 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setShowReviewModal(false)}
                    className="px-4 py-2.5 text-sm text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submittingReview}
                    className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold text-sm rounded-xl transition-all shadow-md shadow-blue-600/20 cursor-pointer"
                  >
                    {submittingReview ? 'Submitting...' : 'Submit Review'}
                  </button>
                </div>
              </form>
            )}

          </div>
        </div>
      )}

      {/* 7. HELP US IMPROVE MEDIVERSE — MODERN FEEDBACK SECTION (Dark navy/medical blue) */}
      <section className="relative overflow-hidden py-20 sm:py-26 bg-gradient-to-b from-[#071736] via-[#0e2754] to-[#081838] text-white border-t border-b border-blue-900/60">
        
        {/* Ambient Glows */}
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[300px] bg-blue-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 right-10 w-64 h-64 bg-sky-400/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-2xl mx-auto mb-10 space-y-3">
            <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-blue-500/20 border border-blue-400/30 text-blue-200 text-xs font-semibold tracking-wide uppercase backdrop-blur-xs">
              <HelpCircle className="w-3.5 h-3.5 text-blue-300" />
              <span>Feature Suggestions & Input</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight">
              Help Us Improve MediVerse
            </h2>
            <p className="text-blue-100/90 text-sm sm:text-base leading-relaxed">
              Your feedback helps us build a better healthcare experience.
            </p>
          </div>

          {/* Clean, Compact, Visually Attractive Form Card */}
          <div className="bg-white text-slate-900 rounded-3xl p-6 sm:p-10 shadow-2xl border border-blue-100 max-w-2xl mx-auto">
            
            {fbSuccess ? (
              <div className="py-8 px-4 text-center space-y-3 bg-emerald-50/80 rounded-2xl border border-emerald-200 animate-fadeIn">
                <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 mx-auto flex items-center justify-center shadow-xs">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <h4 className="text-base font-bold text-emerald-950">Thank You!</h4>
                <p className="text-sm text-emerald-800 font-medium max-w-md mx-auto leading-relaxed">
                  {fbSuccess}
                </p>
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => setFbSuccess(null)}
                    className="px-4 py-2 rounded-xl bg-white border border-emerald-300 text-emerald-800 text-xs font-semibold hover:bg-emerald-100/50 transition-colors shadow-xs"
                  >
                    Send Additional Feedback
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleFeedbackSubmit} className="space-y-4 sm:space-y-5">
                {fbError && (
                  <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{fbError}</span>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Name <span className="text-blue-600">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={fbName}
                      onChange={e => setFbName(e.target.value)}
                      placeholder="Your full name"
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-300 bg-slate-50/50 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-white transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Email (Optional)
                    </label>
                    <input
                      type="email"
                      value={fbEmail}
                      onChange={e => setFbEmail(e.target.value)}
                      placeholder="your@email.com"
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-300 bg-slate-50/50 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-white transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Feedback Type <span className="text-blue-600">*</span>
                  </label>
                  <select
                    value={fbType}
                    onChange={e => setFbType(e.target.value as FeedbackType)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 bg-slate-50/50 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-white transition-all"
                  >
                    <option value="Website Experience">Website Experience</option>
                    <option value="AI Feature">AI Feature</option>
                    <option value="Lab Report Analysis">Lab Report Analysis</option>
                    <option value="Symptom Checker">Symptom Checker</option>
                    <option value="Medicine Information">Medicine Information</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Message <span className="text-blue-600">*</span>
                  </label>
                  <textarea
                    required
                    rows={4}
                    value={fbMessage}
                    onChange={e => setFbMessage(e.target.value)}
                    placeholder="Tell us what worked well or what you would like to see improved..."
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 bg-slate-50/50 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-white resize-none transition-all"
                  />
                </div>

                <div className="pt-2 flex items-center justify-end">
                  <button
                    type="submit"
                    disabled={submittingFb}
                    className="w-full sm:w-auto px-8 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 disabled:opacity-50 text-white font-semibold text-sm transition-all shadow-md shadow-blue-600/20 hover:shadow-lg flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Send className="w-4 h-4" />
                    <span>{submittingFb ? 'Sending Feedback...' : 'Send Feedback'}</span>
                  </button>
                </div>
              </form>
            )}

          </div>
        </div>
      </section>

      {/* 8. CONTACT MEDIVERSE — PREMIUM SECTION (Main background: very light blue) */}
      <section id="contact-section" className="py-20 sm:py-28 bg-[#f0f6fc] border-t border-b border-blue-100/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-14 items-start max-w-6xl mx-auto">
            
            {/* LEFT COLUMN: Headings, AI Healthcare Visual, and 3 Information Items */}
            <div className="lg:col-span-5 space-y-8">
              <div className="space-y-3">
                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-100 border border-blue-200 text-blue-800 text-xs font-semibold tracking-wide uppercase">
                  <Mail className="w-3.5 h-3.5 text-blue-600" />
                  <span>Support & Assistance</span>
                </div>
                <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight leading-tight">
                  Contact MediVerse
                </h2>
                <p className="text-slate-600 text-base leading-relaxed">
                  Have a question or need help using MediVerse? We're here to help.
                </p>
              </div>

              {/* Clean Healthcare / AI Visual Card */}
              <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#091e42] via-[#0d2b5e] to-[#071630] p-6 text-white shadow-lg border border-blue-700/40">
                <div className="absolute -right-6 -bottom-6 w-32 h-32 bg-blue-500/20 rounded-full blur-2xl pointer-events-none" />
                
                <div className="relative z-10 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="w-10 h-10 rounded-xl bg-blue-500/20 border border-blue-400/30 flex items-center justify-center text-blue-300">
                      <HeartPulse className="w-5 h-5 text-blue-300 animate-pulse" />
                    </div>
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-xs font-medium">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                      Support Active
                    </span>
                  </div>

                  <div>
                    <h4 className="text-base font-bold text-white tracking-tight">
                      Healthcare Intelligence Center
                    </h4>
                    <p className="text-xs text-blue-100/80 mt-1 leading-relaxed">
                      Encrypted and dedicated channels for technical queries, report guidance, and patient feedback.
                    </p>
                  </div>

                  {/* Micro Healthcare Wave Graphic */}
                  <div className="pt-1 opacity-70">
                    <svg className="w-full h-8 text-blue-400" viewBox="0 0 200 30" fill="none">
                      <path
                        d="M 0 15 L 40 15 L 50 15 L 60 5 L 70 25 L 80 10 L 90 18 L 95 15 L 200 15"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </div>
                </div>
              </div>

              {/* 3 Information Items */}
              <div className="space-y-4 pt-1">
                {/* 1. Email Support */}
                <div className="flex items-start gap-4 p-4 rounded-2xl bg-white border border-blue-100/90 shadow-sm hover:border-blue-300 transition-colors">
                  <div className="w-11 h-11 rounded-xl bg-blue-50 border border-blue-100 text-blue-600 flex items-center justify-center shrink-0">
                    <Mail className="w-5 h-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-bold text-slate-900 text-sm">Email Support</h3>
                    <p className="text-xs text-slate-500 mt-0.5">Quick responses for platform & general inquiries</p>
                    <a href="mailto:support@mediverse.health" className="text-sm font-semibold text-blue-600 hover:text-blue-700 hover:underline mt-1 block">
                      support@mediverse.health
                    </a>
                  </div>
                </div>

                {/* 2. Healthcare Assistance */}
                <div className="flex items-start gap-4 p-4 rounded-2xl bg-white border border-blue-100/90 shadow-sm hover:border-blue-300 transition-colors">
                  <div className="w-11 h-11 rounded-xl bg-blue-50 border border-blue-100 text-blue-600 flex items-center justify-center shrink-0">
                    <Stethoscope className="w-5 h-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-bold text-slate-900 text-sm">Healthcare Assistance</h3>
                    <p className="text-xs text-slate-500 mt-0.5">Guidance on lab report formats, symptoms & wellness tools</p>
                    <p className="text-xs font-medium text-slate-700 mt-1">Available across all MediVerse features</p>
                  </div>
                </div>

                {/* 3. Send Feedback */}
                <div className="flex items-start gap-4 p-4 rounded-2xl bg-white border border-blue-100/90 shadow-sm hover:border-blue-300 transition-colors">
                  <div className="w-11 h-11 rounded-xl bg-blue-50 border border-blue-100 text-blue-600 flex items-center justify-center shrink-0">
                    <MessageCircle className="w-5 h-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-bold text-slate-900 text-sm">Send Feedback</h3>
                    <p className="text-xs text-slate-500 mt-0.5">Help us continually refine AI accuracy and experience</p>
                    <p className="text-xs font-medium text-slate-700 mt-1">Directly reviewed by our development team</p>
                  </div>
                </div>
              </div>

            </div>

            {/* RIGHT COLUMN: Premium Contact Form */}
            <div className="lg:col-span-7">
              <div className="bg-white rounded-3xl p-7 sm:p-10 shadow-xl shadow-blue-900/5 border border-blue-100/90">
                <div className="mb-6 pb-4 border-b border-slate-100">
                  <h3 className="text-xl font-bold text-slate-900 tracking-tight">
                    Send a Direct Message
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">
                    Fill in your details below and our team will get back to you promptly.
                  </p>
                </div>

                {contactSuccess ? (
                  <div className="py-10 px-6 text-center space-y-4 bg-emerald-50/70 rounded-2xl border border-emerald-200 animate-fadeIn">
                    <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 mx-auto flex items-center justify-center shadow-sm">
                      <CheckCircle2 className="w-8 h-8" />
                    </div>
                    <div className="space-y-1.5 max-w-md mx-auto">
                      <h4 className="text-lg font-bold text-emerald-950">
                        Message Sent Successfully
                      </h4>
                      <p className="text-sm text-emerald-800 leading-relaxed font-medium">
                        Message sent successfully. Thank you for contacting MediVerse.
                      </p>
                    </div>
                    <div className="pt-2">
                      <button
                        type="button"
                        onClick={() => setContactSuccess(null)}
                        className="px-5 py-2.5 rounded-xl bg-white border border-emerald-300 text-emerald-800 text-xs font-semibold hover:bg-emerald-100/50 transition-colors shadow-xs"
                      >
                        Send Another Message
                      </button>
                    </div>
                  </div>
                ) : (
                  <form onSubmit={handleContactSubmit} className="space-y-5">
                    {contactError && (
                      <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 shrink-0" />
                        <span>{contactError}</span>
                      </div>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                          Full Name <span className="text-blue-600">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          value={contactName}
                          onChange={e => setContactName(e.target.value)}
                          placeholder="e.g. Dr. Alex Morgan"
                          className="w-full px-4 py-3 rounded-xl border border-slate-300 bg-slate-50/50 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-white transition-all"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                          Email Address <span className="text-blue-600">*</span>
                        </label>
                        <input
                          type="email"
                          required
                          value={contactEmail}
                          onChange={e => setContactEmail(e.target.value)}
                          placeholder="alex.morgan@example.com"
                          className="w-full px-4 py-3 rounded-xl border border-slate-300 bg-slate-50/50 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-white transition-all"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                        Subject
                      </label>
                      <input
                        type="text"
                        value={contactSubject}
                        onChange={e => setContactSubject(e.target.value)}
                        placeholder="e.g., Question about lab report OCR or appointment scheduling"
                        className="w-full px-4 py-3 rounded-xl border border-slate-300 bg-slate-50/50 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-white transition-all"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                        Message <span className="text-blue-600">*</span>
                      </label>
                      <textarea
                        required
                        rows={5}
                        value={contactMessage}
                        onChange={e => setContactMessage(e.target.value)}
                        placeholder="Please describe your question, feedback, or technical inquiry in detail..."
                        className="w-full px-4 py-3 rounded-xl border border-slate-300 bg-slate-50/50 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-white transition-all resize-none"
                      />
                    </div>

                    <div className="pt-2 flex items-center justify-between">
                      <p className="text-xs text-slate-500">
                        <Lock className="w-3.5 h-3.5 inline mr-1 text-blue-600" />
                        Encrypted & confidential submission
                      </p>
                      <button
                        type="submit"
                        disabled={submittingContact}
                        className="px-8 py-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 disabled:opacity-50 text-white font-semibold text-sm transition-all shadow-md shadow-blue-600/20 hover:shadow-lg hover:shadow-blue-600/30 flex items-center gap-2 cursor-pointer"
                      >
                        <Send className="w-4 h-4" />
                        <span>{submittingContact ? 'Sending Message...' : 'Send Message'}</span>
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </div>

          </div>

        </div>
      </section>

      {/* 9. FINAL HEALTHCARE CTA — ABOVE FOOTER (Dark navy/medical blue) */}
      <section className="relative overflow-hidden bg-[#061229] text-white py-20 sm:py-28 border-t border-blue-950">
        
        {/* Background Video */}
        <video
          ref={ctaVideoRef}
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
          aria-hidden="true"
          className="absolute inset-0 w-full h-full object-cover z-0 pointer-events-none opacity-40"
          style={{ objectFit: 'cover' }}
        >
          <source src="/assets/1000240377.mp4" type="video/mp4" />
        </video>

        {/* Lightweight Animated Healthcare Graphics / Network Background */}
        <div className="absolute inset-0 z-0 opacity-20 pointer-events-none">
          <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg" width="100%" height="100%">
            <defs>
              <pattern id="cta-medical-grid" width="60" height="60" patternUnits="userSpaceOnUse">
                <path d="M 60 0 L 0 0 0 60" fill="none" stroke="#38bdf8" strokeWidth="0.5" />
                <circle cx="30" cy="30" r="1.5" fill="#60a5fa" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#cta-medical-grid)" />
          </svg>
        </div>

        {/* Flowing Medical Telemetry Line */}
        <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 opacity-15 pointer-events-none z-0">
          <svg className="w-full h-24" preserveAspectRatio="none" viewBox="0 0 1200 100" fill="none">
            <path
              d="M 0 50 L 300 50 L 330 20 L 360 80 L 390 35 L 420 60 L 450 50 L 750 50 L 780 15 L 810 85 L 840 30 L 870 65 L 900 50 L 1200 50"
              stroke="#60a5fa"
              strokeWidth="2"
              strokeDasharray="8 8"
            />
          </svg>
        </div>

        {/* Ambient Glows */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-blue-600/15 rounded-full blur-3xl pointer-events-none z-0" />
        <div className="absolute top-0 right-1/4 w-72 h-72 bg-sky-500/10 rounded-full blur-2xl pointer-events-none z-0" />

        {/* Semi-transparent dark blue overlay */}
        <div className="absolute inset-0 z-10 bg-gradient-to-b from-[#061229]/80 via-[#071738]/70 to-[#061229]/90 pointer-events-none" />

        {/* CTA Content */}
        <div className="relative z-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="max-w-3xl mx-auto space-y-6">
            
            {/* Small Badge */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-500/20 border border-blue-400/30 text-blue-200 text-xs font-semibold tracking-wider uppercase backdrop-blur-xs">
              <Sparkles className="w-3.5 h-3.5 text-blue-400" />
              <span>AI-POWERED HEALTHCARE</span>
            </div>

            {/* Heading */}
            <h2 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight leading-tight drop-shadow-sm">
              Your Health. <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-300 via-sky-200 to-white">Better Understood.</span>
            </h2>

            {/* Description */}
            <p className="text-base sm:text-lg text-blue-100/90 font-normal leading-relaxed max-w-2xl mx-auto">
              Understand your health information with simple AI-powered tools designed to help you make informed healthcare decisions.
            </p>

            {/* Action Buttons with Hover Animation */}
            <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3.5 sm:gap-4">
              <button
                id="cta-analyze-lab-report"
                onClick={() => onNavigate('lab-report')}
                className="w-full sm:w-auto px-7 py-3.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold shadow-lg shadow-blue-950/60 flex items-center justify-center gap-2 text-base transition-all transform hover:-translate-y-0.5 hover:shadow-xl active:translate-y-0 cursor-pointer"
              >
                <span>Analyze Lab Report</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                id="cta-talk-to-ai"
                onClick={() => onNavigate('ai-chat')}
                className="w-full sm:w-auto px-7 py-3.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold border border-white/20 shadow-xs flex items-center justify-center gap-2 text-base backdrop-blur-md transition-all transform hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
              >
                <MessageSquare className="w-4 h-4 text-sky-300" />
                <span>Talk to AI</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

          </div>
        </div>
      </section>

      {/* Login Required Modal */}
      {showLoginRequiredModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white text-slate-900 rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-slate-200 animate-fadeIn space-y-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-blue-50 border border-blue-100 text-blue-600 flex items-center justify-center">
                  <Lock className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900 leading-tight">Login Required</h3>
                  <span className="text-xs text-blue-600 font-semibold uppercase tracking-wider">
                    My Health Records
                  </span>
                </div>
              </div>
              <button
                onClick={() => setShowLoginRequiredModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
                title="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-sm text-slate-600 leading-relaxed">
              <p>
                <strong>My Health Records</strong> is a secure, private health portal. Please log in or create an account to access:
              </p>
              <ul className="space-y-1.5 pl-2 text-xs text-slate-700">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />
                  <span>Lab Reports Archive & Parameter Analysis</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />
                  <span>Side-by-Side Report Comparison & Deltas</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />
                  <span>Digital Doctor Prescriptions & Regimens</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />
                  <span>Health History, Timeline & Clinical Notes</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />
                  <span>Scheduled Consultations & PDF Downloads</span>
                </li>
              </ul>
            </div>

            <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row items-center gap-3">
              <button
                onClick={() => {
                  setShowLoginRequiredModal(false);
                  onNavigate('login');
                }}
                className="w-full sm:flex-1 py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold text-sm shadow-md shadow-blue-600/20 flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-95"
              >
                <LogIn className="w-4 h-4" />
                <span>Log In</span>
              </button>
              <button
                onClick={() => {
                  setShowLoginRequiredModal(false);
                  onNavigate('signup');
                }}
                className="w-full sm:flex-1 py-3 px-4 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-95"
              >
                <UserPlus className="w-4 h-4" />
                <span>Create Account</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
