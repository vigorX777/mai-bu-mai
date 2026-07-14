import type { Metadata } from "next";
import { QuizApp } from "./quiz-app";

export const metadata: Metadata = {
  title: "下单前先查查谁在控制你的手",
  description: "5 道交易心理情境题，生成你的今日韭菜人格卡。不荐股，只查你此刻有没有上头。",
};

export default function Home() {
  return <QuizApp />;
}
