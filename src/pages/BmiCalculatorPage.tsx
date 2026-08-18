import React, { useState } from 'react';
import {
  Calculator,
  Activity,
  Heart,
  Scale,
  Sparkles,
  Info,
  CheckCircle2,
  BookmarkPlus,
  ArrowRight
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.js';
import { DisclaimerBanner } from '../components/DisclaimerBanner.js';
import { BmiRecord } from '../types.js';

interface BmiCalculatorPageProps {
  onNavigate: (page: string) => void;
}

export const BmiCalculatorPage: React.FC<BmiCalculatorPageProps> = ({ onNavigate }) => {
  const { user, token } = useAuth();
  const [unitSystem, setUnitSystem] = useState<'metric' | 'imperial'>('metric');

  // Metric fields
  const [heightCm, setHeightCm] = useState('');
  const [weightKg, setWeightKg] = useState('');

  // Imperial fields
  const [heightFt, setHeightFt] = useState('');
  const [heightIn, setHeightIn] = useState('');
  const [weightLb, setWeightLb] = useState('');

  // Demographics
  const [age, setAge] = useState('');
  const [sex, setSex] = useState('');

  // Result state
  const [result, setResult] = useState<BmiRecord | null>(null);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const calculateBmi = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setError(null);
    setSavedSuccess(false);

    let finalHeightCm = 0;
    let finalWeightKg = 0;

    if (unitSystem === 'metric') {
      finalHeightCm = parseFloat(heightCm);
      finalWeightKg = parseFloat(weightKg);
      if (!finalHeightCm || finalHeightCm <= 0 || !finalWeightKg || finalWeightKg <= 0) {
        setError('Please enter valid positive numbers for height (cm) and weight (kg).');
        return;
      }
    } else {
      const ft = parseFloat(heightFt) || 0;
      const inch = parseFloat(heightIn) || 0;
      const totalInches = ft * 12 + inch;
      const lb = parseFloat(weightLb);

      if (totalInches <= 0 || !lb || lb <= 0) {
        setError('Please enter valid positive numbers for height (feet/inches) and weight (pounds).');
        return;
      }

      finalHeightCm = totalInches * 2.54;
      finalWeightKg = lb * 0.45359237;
    }

    const heightMeters = finalHeightCm / 100;
    const bmiVal = parseFloat((finalWeightKg / (heightMeters * heightMeters)).toFixed(1));

    let category: BmiRecord['category'] = 'Normal weight';
    let guidance: string[] = [];

    if (bmiVal < 18.5) {
      category = 'Underweight';
      guidance = [
        'Consider consulting a nutritionist or doctor to ensure you are meeting daily caloric and macronutrient needs.',
        'Focus on nutrient-dense whole foods like nuts, avocados, lean proteins, and complex whole grains.',
        'Incorporate progressive resistance exercise to build lean muscle mass.'
      ];
    } else if (bmiVal >= 18.5 && bmiVal <= 24.9) {
      category = 'Normal weight';
      guidance = [
        'Maintain a balanced dietary pattern rich in colorful vegetables, fiber, healthy fats, and adequate hydration.',
        'Engage in at least 150 minutes of moderate aerobic activity and 2 strength sessions weekly.',
        'Prioritize 7–9 hours of restful sleep and proactive stress management.'
      ];
    } else if (bmiVal >= 25.0 && bmiVal <= 29.9) {
      category = 'Overweight';
      guidance = [
        'Incorporate daily moderate cardiovascular exercise such as brisk walking, swimming, or cycling.',
        'Emphasize whole unprocessed foods while reducing added sugars, refined carbohydrates, and sugary beverages.',
        'Discuss baseline cardiovascular markers (blood pressure, lipid profile) during your routine physician checkups.'
      ];
    } else if (bmiVal >= 30.0 && bmiVal <= 34.9) {
      category = 'Obesity Class I';
      guidance = [
        'Partner with a qualified healthcare provider or registered dietitian for sustainable lifestyle coaching.',
        'Focus on sustainable, gradual weight management through portion awareness and enjoyable physical activity.',
        'Monitor metabolic indicators including fasting blood glucose and blood pressure.'
      ];
    } else if (bmiVal >= 35.0 && bmiVal <= 39.9) {
      category = 'Obesity Class II';
      guidance = [
        'Seek comprehensive clinical guidance to evaluate cardiovascular and metabolic wellness.',
        'Adopt a structured physical activity plan tailored safely to your joint health and fitness level.',
        'Work with a multidisciplinary team for holistic metabolic support.'
      ];
    } else {
      category = 'Severe Obesity';
      guidance = [
        'Work closely with healthcare specialists to evaluate tailored medical and lifestyle interventions.',
        'Prioritize joint-friendly movements such as water aerobics or seated exercises.',
        'Regularly monitor vital signs and metabolic laboratory panels.'
      ];
    }

    const calculatedRecord: BmiRecord = {
      id: `bmi_${Date.now()}`,
      userId: user?.id,
      date: new Date().toISOString(),
      age: parseInt(age) || 30,
      sex: sex || 'Not specified',
      heightCm: Math.round(finalHeightCm),
      weightKg: Math.round(finalWeightKg * 10) / 10,
      bmi: bmiVal,
      category,
      guidance
    };

    setResult(calculatedRecord);
  };

  const handleSaveToProfile = async () => {
    if (!result) return;
    setSaveLoading(true);
    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch('/api/bmi', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          age: result.age,
          sex: result.sex,
          heightCm: result.heightCm,
          weightKg: result.weightKg,
          bmi: result.bmi,
          category: result.category,
          guidance: result.guidance
        })
      });

      if (res.ok) {
        setSavedSuccess(true);
      }
    } catch (err) {
      console.error('Failed to save BMI:', err);
    } finally {
      setSaveLoading(false);
    }
  };

  const getCategoryColor = (cat: string) => {
    switch (cat) {
      case 'Normal weight':
        return 'text-emerald-700 bg-emerald-50 border-emerald-200';
      case 'Underweight':
        return 'text-blue-700 bg-blue-50 border-blue-200';
      case 'Overweight':
        return 'text-amber-700 bg-amber-50 border-amber-200';
      default:
        return 'text-red-700 bg-red-50 border-red-200';
    }
  };

  return (
    <div id="bmi-calculator-page" className="min-h-screen bg-slate-50 py-8 sm:py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 space-y-8">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-100 text-blue-800 text-xs font-semibold">
            <Calculator className="w-3.5 h-3.5 text-blue-600" />
            <span>Body Mass Index & Lifestyle Guidance</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            BMI Calculator
          </h1>
          <p className="text-slate-600 text-sm sm:text-base">
            Calculate your Body Mass Index (BMI) using standard medical formulas and explore educational lifestyle and nutrition pointers.
          </p>
        </div>

        {/* Calculator Form */}
        <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-6">
          {/* Unit Toggle */}
          <div className="flex justify-center">
            <div className="bg-slate-100 p-1 rounded-xl flex items-center gap-1">
              <button
                type="button"
                onClick={() => setUnitSystem('metric')}
                className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all ${
                  unitSystem === 'metric'
                    ? 'bg-white text-blue-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Metric (cm / kg)
              </button>
              <button
                type="button"
                onClick={() => setUnitSystem('imperial')}
                className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all ${
                  unitSystem === 'imperial'
                    ? 'bg-white text-blue-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Imperial (ft, in / lb)
              </button>
            </div>
          </div>

          <form onSubmit={calculateBmi} className="space-y-6">
            {/* Demographics */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-700">
                  Age (years)
                </label>
                <input
                  type="number"
                  value={age}
                  onChange={e => setAge(e.target.value)}
                  placeholder="e.g. 30"
                  min={2}
                  max={120}
                  className="w-full p-3 rounded-xl border border-slate-300 text-sm focus:outline-hidden focus:border-blue-600"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-700">
                  Sex (Optional)
                </label>
                <select
                  value={sex}
                  onChange={e => setSex(e.target.value)}
                  className="w-full p-3 rounded-xl border border-slate-300 text-sm bg-white focus:outline-hidden focus:border-blue-600"
                >
                  <option value="">Select (Optional)</option>
                  <option value="Female">Female</option>
                  <option value="Male">Male</option>
                </select>
              </div>
            </div>

            {/* Height & Weight Inputs */}
            {unitSystem === 'metric' ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-700">
                    Height (cm) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    value={heightCm}
                    onChange={e => setHeightCm(e.target.value)}
                    placeholder="e.g. 175"
                    step="0.1"
                    min="50"
                    max="250"
                    className="w-full p-3.5 rounded-xl border border-slate-300 text-sm focus:outline-hidden focus:border-blue-600"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-700">
                    Weight (kg) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    value={weightKg}
                    onChange={e => setWeightKg(e.target.value)}
                    placeholder="e.g. 70"
                    step="0.1"
                    min="20"
                    max="350"
                    className="w-full p-3.5 rounded-xl border border-slate-300 text-sm focus:outline-hidden focus:border-blue-600"
                    required
                  />
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-700">
                    Height (Feet) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    value={heightFt}
                    onChange={e => setHeightFt(e.target.value)}
                    placeholder="e.g. 5"
                    min="1"
                    max="8"
                    className="w-full p-3.5 rounded-xl border border-slate-300 text-sm focus:outline-hidden focus:border-blue-600"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-700">
                    Height (Inches)
                  </label>
                  <input
                    type="number"
                    value={heightIn}
                    onChange={e => setHeightIn(e.target.value)}
                    placeholder="e.g. 9"
                    min="0"
                    max="11"
                    className="w-full p-3.5 rounded-xl border border-slate-300 text-sm focus:outline-hidden focus:border-blue-600"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-700">
                    Weight (lbs) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    value={weightLb}
                    onChange={e => setWeightLb(e.target.value)}
                    placeholder="e.g. 155"
                    step="0.1"
                    min="40"
                    max="700"
                    className="w-full p-3.5 rounded-xl border border-slate-300 text-sm focus:outline-hidden focus:border-blue-600"
                    required
                  />
                </div>
              </div>
            )}

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs">
                {error}
              </div>
            )}

            <button
              type="submit"
              className="w-full py-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm shadow-md shadow-blue-600/20 flex items-center justify-center gap-2 transition-all"
            >
              <Scale className="w-4 h-4" />
              <span>Calculate BMI</span>
            </button>
          </form>
        </div>

        {/* Results Card */}
        {result && (
          <div id="bmi-result-card" className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-6 animate-fadeIn">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-6">
              <div className="space-y-1">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">
                  Calculated Result
                </p>
                <div className="flex items-baseline gap-3">
                  <span className="text-4xl sm:text-5xl font-extrabold text-slate-900 font-mono">
                    {result.bmi}
                  </span>
                  <span className="text-sm text-slate-500 font-medium">kg/m²</span>
                </div>
              </div>

              <div className="flex flex-col sm:items-end gap-2">
                <span
                  className={`px-4 py-1.5 rounded-full text-sm font-bold border ${getCategoryColor(
                    result.category
                  )}`}
                >
                  {result.category}
                </span>
                <p className="text-xs text-slate-400">
                  Height: {result.heightCm} cm • Weight: {result.weightKg} kg
                </p>
              </div>
            </div>

            {/* BMI Categories Reference Bar */}
            <div className="space-y-2">
              <p className="text-xs font-semibold text-slate-600">Standard WHO BMI Classifications:</p>
              <div className="grid grid-cols-4 gap-1 text-center text-[10px] sm:text-xs font-medium">
                <div className="p-2 rounded-lg bg-blue-50 text-blue-800 border border-blue-200">
                  &lt; 18.5
                  <div className="text-[10px] text-blue-600 font-normal">Underweight</div>
                </div>
                <div className="p-2 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200">
                  18.5 – 24.9
                  <div className="text-[10px] text-emerald-600 font-normal">Normal</div>
                </div>
                <div className="p-2 rounded-lg bg-amber-50 text-amber-800 border border-amber-200">
                  25.0 – 29.9
                  <div className="text-[10px] text-amber-600 font-normal">Overweight</div>
                </div>
                <div className="p-2 rounded-lg bg-red-50 text-red-800 border border-red-200">
                  ≥ 30.0
                  <div className="text-[10px] text-red-600 font-normal">Obesity</div>
                </div>
              </div>
            </div>

            {/* Guidance */}
            <div className="space-y-3 pt-2">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                <Heart className="w-4 h-4 text-blue-600" />
                <span>General Educational Lifestyle Guidance</span>
              </h3>
              <ul className="space-y-2 text-xs sm:text-sm text-slate-700">
                {result.guidance.map((item, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-blue-500 font-bold">•</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Save to Profile CTA */}
            <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
              {user ? (
                savedSuccess ? (
                  <div className="flex items-center gap-1.5 text-xs text-emerald-700 font-medium">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Saved to your health profile history!</span>
                  </div>
                ) : (
                  <button
                    onClick={handleSaveToProfile}
                    disabled={saveLoading}
                    className="px-4 py-2 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                  >
                    <BookmarkPlus className="w-4 h-4" />
                    <span>{saveLoading ? 'Saving...' : 'Save to Profile History'}</span>
                  </button>
                )
              ) : (
                <p className="text-xs text-slate-500">
                  <button
                    onClick={() => onNavigate('login')}
                    className="text-blue-600 font-semibold hover:underline"
                  >
                    Log in
                  </button>{' '}
                  to track your BMI history over time.
                </p>
              )}

              <button
                onClick={() => onNavigate('appointment')}
                className="text-xs text-blue-600 hover:text-blue-700 font-semibold flex items-center gap-1"
              >
                <span>Discuss with a Doctor</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        <div className="p-4 bg-slate-100 rounded-xl text-slate-600 text-xs flex items-start gap-2.5">
          <Info className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
          <p>
            <strong>Note:</strong> BMI is a general population screening metric. It does not measure body composition, muscle distribution, bone density, or individual metabolic health directly. Always interpret BMI in consultation with a physician.
          </p>
        </div>

        <DisclaimerBanner />
      </div>
    </div>
  );
};
