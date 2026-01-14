"use client";

import { useState } from "react";
import { CheckCircle2, Clock, Upload, User, FileText, Camera, AlertCircle, ArrowRight, Loader2 } from "lucide-react";

type KYCStatus = "not_started" | "in_progress" | "pending_review" | "approved" | "rejected";
type KYCStep = 1 | 2 | 3 | 4;

const STEPS = [
  { num: 1, title: "멤버십 확인", description: "도서 구매 인증" },
  { num: 2, title: "기본 정보", description: "이름, 생년월일, 연락처" },
  { num: 3, title: "신분증 인증", description: "신분증 업로드" },
  { num: 4, title: "얼굴 인증", description: "셀카 촬영" },
];

export function KYCFlow() {
  const [status, setStatus] = useState<KYCStatus>("not_started");
  const [currentStep, setCurrentStep] = useState<KYCStep>(1);
  const [isProcessing, setIsProcessing] = useState(false);

  // Form states
  const [membershipCode, setMembershipCode] = useState("");
  const [formData, setFormData] = useState({
    name: "",
    birthdate: "",
    phone: "",
  });
  const [idUploaded, setIdUploaded] = useState(false);
  const [selfieUploaded, setSelfieUploaded] = useState(false);

  const handleMembershipVerify = async () => {
    if (!membershipCode) return;
    setIsProcessing(true);
    await new Promise((resolve) => setTimeout(resolve, 1500));
    setIsProcessing(false);
    setCurrentStep(2);
    setStatus("in_progress");
  };

  const handleBasicInfoSubmit = async () => {
    if (!formData.name || !formData.birthdate || !formData.phone) return;
    setIsProcessing(true);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setIsProcessing(false);
    setCurrentStep(3);
  };

  const handleIdUpload = async () => {
    setIsProcessing(true);
    await new Promise((resolve) => setTimeout(resolve, 2000));
    setIsProcessing(false);
    setIdUploaded(true);
    setCurrentStep(4);
  };

  const handleSelfieCapture = async () => {
    setIsProcessing(true);
    await new Promise((resolve) => setTimeout(resolve, 2000));
    setIsProcessing(false);
    setSelfieUploaded(true);
    setStatus("pending_review");
  };

  const handleApprove = async () => {
    setIsProcessing(true);
    await new Promise((resolve) => setTimeout(resolve, 3000));
    setIsProcessing(false);
    setStatus("approved");
  };

  // Render based on status
  if (status === "approved") {
    return (
      <div className="bg-green-50 border-2 border-green-600 p-8 text-center">
        <CheckCircle2 className="h-16 w-16 text-green-600 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">KYC 인증 완료</h2>
        <p className="text-gray-600 mb-4">
          신원 인증이 완료되었습니다. 이제 투자에 참여하실 수 있습니다.
        </p>
        <div className="inline-block p-4 bg-white border border-green-300 rounded">
          <div className="text-sm text-gray-500">온체인 상태</div>
          <div className="font-mono text-green-600 font-bold">✓ KYC Verified</div>
        </div>
        <div className="mt-6">
          <a
            href="/realfi/invest"
            className="inline-flex items-center gap-2 px-6 py-3 bg-gray-900 text-white font-medium hover:bg-gray-800"
          >
            투자 시작하기 <ArrowRight className="h-4 w-4" />
          </a>
        </div>
      </div>
    );
  }

  if (status === "pending_review") {
    return (
      <div className="bg-yellow-50 border-2 border-yellow-400 p-8 text-center">
        <Clock className="h-16 w-16 text-yellow-600 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">검토 중</h2>
        <p className="text-gray-600 mb-4">
          제출하신 서류를 검토 중입니다. 보통 5분 이내에 완료됩니다.
        </p>
        <div className="inline-block p-4 bg-white border border-yellow-300 rounded">
          <div className="text-sm text-gray-500">상태</div>
          <div className="font-medium text-yellow-600">자동 검증 진행 중...</div>
        </div>
        <div className="mt-6">
          <button
            onClick={handleApprove}
            disabled={isProcessing}
            className="inline-flex items-center gap-2 px-6 py-3 bg-gray-900 text-white font-medium hover:bg-gray-800 disabled:opacity-50"
          >
            {isProcessing ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                검증 중...
              </>
            ) : (
              "(데모) 승인 처리"
            )}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border-2 border-gray-200">
      {/* Progress Steps */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          {STEPS.map((step, idx) => (
            <div key={step.num} className="flex items-center">
              <div className="flex flex-col items-center">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                    currentStep > step.num
                      ? "bg-green-600 text-white"
                      : currentStep === step.num
                      ? "bg-gray-900 text-white"
                      : "bg-gray-200 text-gray-400"
                  }`}
                >
                  {currentStep > step.num ? (
                    <CheckCircle2 className="h-5 w-5" />
                  ) : (
                    step.num
                  )}
                </div>
                <div className="mt-2 text-center">
                  <div className={`text-xs font-medium ${
                    currentStep >= step.num ? "text-gray-900" : "text-gray-400"
                  }`}>
                    {step.title}
                  </div>
                </div>
              </div>
              {idx < STEPS.length - 1 && (
                <div className={`w-full h-1 mx-2 ${
                  currentStep > step.num ? "bg-green-600" : "bg-gray-200"
                }`} style={{ minWidth: "40px" }} />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Step Content */}
      <div className="p-6">
        {/* Step 1: Membership */}
        {currentStep === 1 && (
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-gray-900">멤버십 확인</h3>
            <p className="text-gray-600">
              《서울가옥》 도서 구매 시 받은 멤버십 코드를 입력해주세요.
            </p>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                멤버십 코드
              </label>
              <input
                type="text"
                value={membershipCode}
                onChange={(e) => setMembershipCode(e.target.value)}
                placeholder="예: SG-XXXX-XXXX"
                className="w-full px-4 py-3 border-2 border-gray-200 focus:border-gray-900 outline-none"
              />
            </div>
            <button
              onClick={handleMembershipVerify}
              disabled={!membershipCode || isProcessing}
              className="w-full py-3 bg-gray-900 text-white font-medium hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isProcessing ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  확인 중...
                </span>
              ) : (
                "멤버십 확인"
              )}
            </button>
            <p className="text-xs text-gray-500 text-center">
              멤버십 코드가 없으신가요?{" "}
              <a href="https://smartstore.naver.com/seoulgaok" className="text-gray-900 hover:underline">
                도서 구매하기
              </a>
            </p>
          </div>
        )}

        {/* Step 2: Basic Info */}
        {currentStep === 2 && (
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-gray-900">기본 정보 입력</h3>
            <p className="text-gray-600">
              본인 확인을 위한 기본 정보를 입력해주세요.
            </p>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  이름 (실명)
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="홍길동"
                  className="w-full px-4 py-3 border-2 border-gray-200 focus:border-gray-900 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  생년월일
                </label>
                <input
                  type="date"
                  value={formData.birthdate}
                  onChange={(e) => setFormData({ ...formData, birthdate: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-200 focus:border-gray-900 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  휴대폰 번호
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="010-1234-5678"
                  className="w-full px-4 py-3 border-2 border-gray-200 focus:border-gray-900 outline-none"
                />
              </div>
            </div>
            <button
              onClick={handleBasicInfoSubmit}
              disabled={!formData.name || !formData.birthdate || !formData.phone || isProcessing}
              className="w-full py-3 bg-gray-900 text-white font-medium hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isProcessing ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  저장 중...
                </span>
              ) : (
                "다음"
              )}
            </button>
          </div>
        )}

        {/* Step 3: ID Upload */}
        {currentStep === 3 && (
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-gray-900">신분증 업로드</h3>
            <p className="text-gray-600">
              본인 확인을 위해 신분증을 촬영하거나 업로드해주세요.
            </p>
            <div className="grid grid-cols-3 gap-3 mb-4">
              <button className="p-3 border-2 border-gray-900 bg-gray-900 text-white text-sm font-medium">
                주민등록증
              </button>
              <button className="p-3 border-2 border-gray-200 text-gray-600 text-sm font-medium hover:border-gray-400">
                운전면허증
              </button>
              <button className="p-3 border-2 border-gray-200 text-gray-600 text-sm font-medium hover:border-gray-400">
                여권
              </button>
            </div>
            <div className="border-2 border-dashed border-gray-300 p-8 text-center">
              <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 mb-2">신분증 앞면을 촬영하거나 업로드하세요</p>
              <p className="text-xs text-gray-500">JPG, PNG 파일 (최대 10MB)</p>
            </div>
            <button
              onClick={handleIdUpload}
              disabled={isProcessing}
              className="w-full py-3 bg-gray-900 text-white font-medium hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isProcessing ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  업로드 중...
                </span>
              ) : (
                "(데모) 업로드 완료"
              )}
            </button>
          </div>
        )}

        {/* Step 4: Selfie */}
        {currentStep === 4 && (
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-gray-900">얼굴 인증</h3>
            <p className="text-gray-600">
              신분증과 본인이 일치하는지 확인하기 위해 셀카를 촬영해주세요.
            </p>
            <div className="border-2 border-gray-200 p-8 text-center bg-gray-50">
              <Camera className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 mb-2">카메라를 정면으로 바라봐주세요</p>
              <p className="text-xs text-gray-500">얼굴이 화면 중앙에 오도록 해주세요</p>
            </div>
            <div className="p-3 bg-yellow-50 border border-yellow-200 text-sm text-yellow-800">
              <AlertCircle className="h-4 w-4 inline mr-2" />
              밝은 곳에서 모자나 안경 없이 촬영해주세요.
            </div>
            <button
              onClick={handleSelfieCapture}
              disabled={isProcessing}
              className="w-full py-3 bg-gray-900 text-white font-medium hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isProcessing ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  인증 중...
                </span>
              ) : (
                "(데모) 촬영 완료"
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}