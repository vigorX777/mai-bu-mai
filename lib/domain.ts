export const BIASES = [
  "fomo",
  "herd",
  "recovery",
  "bottom",
  "loss",
  "overconfidence",
  "drift",
] as const;

export const GATES = [
  "impulse",
  "evidence",
  "plan",
  "regret",
  "counterfactual",
] as const;

export type Bias = (typeof BIASES)[number];
export type Gate = (typeof GATES)[number];
export type Dimension = Bias | "brake";
export type TradePath = "buy" | "add" | "sell";
export type Variant = 0 | 1;

export type Scores = Partial<Record<Dimension, number>>;

interface ScoredOption {
  id: "A" | "B" | "C";
  text: string;
  scores: Scores;
}

export interface Option extends ScoredOption {
  thought: string;
  relief: string;
}

export interface Question {
  id: string;
  path: TradePath;
  gate: Gate;
  variant: Variant;
  prompt: string;
  options: [Option, Option, Option];
}

export interface Selection {
  questionId: string;
  optionId: Option["id"];
}

export interface Persona {
  id: Bias | "brake";
  name: string;
  asset: string;
  taunts: [string, string, string];
  strength: string;
  blindspot: string;
  counter: string;
  sticker?: string;
}

export interface QuizResult {
  primary: Bias | "brake";
  secondary: Bias | null;
  scores: Record<Dimension, number>;
  rankedBiases: Bias[];
  tauntIndex: 0 | 1 | 2;
  marketCode: string;
}

export interface SharedResult {
  path: TradePath;
  questionIds: string[];
  selections: Selection[];
}

interface ScoredQuestion extends Omit<Question, "options"> {
  options: [ScoredOption, ScoredOption, ScoredOption];
}

interface QuestionCopy {
  prompt: string;
  options: [
    Pick<Option, "text" | "thought" | "relief">,
    Pick<Option, "text" | "thought" | "relief">,
    Pick<Option, "text" | "thought" | "relief">,
  ];
}

const option = (id: Option["id"], text: string, scores: Scores): ScoredOption => ({
  id,
  text,
  scores,
});

const question = (
  path: TradePath,
  gate: Gate,
  variant: Variant,
  prompt: string,
  options: [ScoredOption, ScoredOption, ScoredOption],
): ScoredQuestion => ({
  id: `${path}-${gate}-${variant === 0 ? "a" : "b"}`,
  path,
  gate,
  variant,
  prompt,
  options,
});

export const PATHS: Record<
  TradePath,
  { label: string; short: string; description: string; status: string }
> = {
  buy: {
    label: "我想买入",
    short: "买入",
    description: "追的是趋势，还是怕别人吃肉？",
    status: "正在检查你是不是又想山顶检票",
  },
  add: {
    label: "我想加仓",
    short: "加仓",
    description: "机会来了，还是成本价喊救命？",
    status: "正在检查你是不是又给错误续杯",
  },
  sell: {
    label: "我想卖出",
    short: "卖出",
    description: "按计划下车，还是被分时图吓跑？",
    status: "正在检查这刀到底该不该割",
  },
};

export const GATE_LABELS: Record<Gate, string> = {
  impulse: "冲动来源",
  evidence: "证据判断",
  plan: "计划完整性",
  regret: "亏损与后悔",
  counterfactual: "反事实检验",
};

export const BIAS_LABELS: Record<Bias, string> = {
  fomo: "追涨冲动",
  herd: "群体依赖",
  recovery: "回本执念",
  bottom: "抄底幻觉",
  loss: "损失厌恶",
  overconfidence: "过度自信",
  drift: "计划漂移",
};

export const PERSONAS: Record<Bias | "brake", Persona> = {
  fomo: {
    id: "fomo",
    name: "追涨火箭手",
    asset: "/characters/fomo.png",
    taunts: [
      "你买的不是股票，是“别人赚钱时我不能缺席”的焦虑。掌声越响，你站得越高。",
      "主力负责拉升，群友负责喊单，你负责在山顶把故事听完。",
      "才看三根阳线就怕错过十年行情，你的长期主义通常只活到第一次回撤。",
    ],
    strength: "闻到热点比新闻推送还快。",
    blindspot: "把红色 K 线当成了尽调报告。",
    counter: "今天不许追。关掉行情，明天还想买再重新算。",
    sticker: "山顶检票员",
  },
  herd: {
    id: "herd",
    name: "群聊共振体",
    asset: "/characters/herd.png",
    taunts: [
      "你把群聊当投研，把点赞当成交量，最后账户替全群承担连带责任。",
      "脱口秀说一句，你先替概念股交门票；公司澄清三次，你说这是欲盖弥彰。",
      "谐音炒作是唯心论的极端，你的仓位是它最诚实的物质代价。",
    ],
    strength: "消息灵通，任何热点都不会错过。",
    blindspot: "谁声音大，谁就临时拥有你的脑子。",
    counter: "群聊静音 24 小时，只写三条你亲自验证过的事实。",
    sticker: "三人成研报",
  },
  recovery: {
    id: "recovery",
    name: "回本教徒",
    asset: "/characters/recovery.png",
    taunts: [
      "公司都准备翻篇了，你还拿着成本价替这段孽缘守灵。",
      "股票早把你忘了，你却每天问它什么时候回家。",
      "你不是在等回本，是在等市场为伤害你这件事正式道歉。",
    ],
    strength: "能熬，能扛，能把日线看成年线。",
    blindspot: "把成本价当成市场必须尊重的家规。",
    counter: "遮住成本价；现在不愿重新买，就立刻重评持有。",
    sticker: "成本价守灵人",
  },
  bottom: {
    id: "bottom",
    name: "抄底预言家",
    asset: "/characters/bottom.png",
    taunts: [
      "别人恐惧你贪婪，别人贪婪你被埋。",
      "抄底抄出地下三层，电梯还礼貌地显示：继续下行。",
      "跌得多在你眼里是打折，在市场眼里可能只是清仓甩卖。",
    ],
    strength: "敢逆向，看到绿色就想研究价值。",
    blindspot: "每一层地下室都被你命名为地板。",
    counter: "先写出反转证据；只有跌幅、没有证据，就别伸手。",
    sticker: "地下室勘探员",
  },
  loss: {
    id: "loss",
    name: "止损失忆者",
    asset: "/characters/loss.png",
    taunts: [
      "“不要怕，是技术性调整”——从负 8% 一路调整成传家宝。",
      "止损写在计划里，长线写在被套后，价值投资写在跌停板上。",
      "你不是能扛，只是把确认亏损延期到家人都发现。",
    ],
    strength: "耐心惊人，软件卸载后尤其稳定。",
    blindspot: "每次触发止损，止损功能就临时维护。",
    counter: "失败条件已触发就执行；别拿长期主义给短线错误续命。",
    sticker: "技术性长线",
  },
  overconfidence: {
    id: "overconfidence",
    name: "全仓自信王",
    asset: "/characters/overconfidence.png",
    taunts: [
      "一成研究配十成仓位，你对世界的理解全靠账户余额背书。",
      "他从小没有父母，自从炒了股，终于天天看见 die 了。",
      "十年炒股两茫茫，先亏车，后亏房；你的仓位负责把观点写进族谱。",
    ],
    strength: "果断，六成把握也敢打出十成仓位。",
    blindspot: "把自信误当成了可追加保证金。",
    counter: "先把仓位砍到判断错了也睡得着，再谈信仰。",
    sticker: "余额负责善后",
  },
  drift: {
    id: "drift",
    name: "计划漂移侠",
    asset: "/characters/drift.png",
    taunts: [
      "你的计划不是用来执行的，是亏损后为你提供不在场证明。",
      "短线套了改中线，中线套了谈价值，退市才算真正长期。",
      "“下次一定按纪律”，是你交易系统里执行最稳定的一条规则。",
    ],
    strength: "适应力极强，任何亏损都能找到新叙事。",
    blindspot: "所有调整都恰好绕开“我可能错了”。",
    counter: "拿出买入前计划；现在的理由不在上面，就按失效处理。",
    sticker: "理由热更新",
  },
  brake: {
    id: "brake",
    name: "下单刹车员",
    asset: "/characters/brake.png",
    taunts: [
      "今天最强的操作不是抓涨停，是没让情绪用你的账户签字。",
      "一把可歌（割）可泣（弃）的韭菜，今天竟然选择不把自己割出去。",
      "你没有预测对市场，只是没急着给最新概念提供流动性。",
    ],
    strength: "尊重不确定性，知道不动也是一种仓位。",
    blindspot: "刹车踩太久，也可能把检查变成逃避。",
    counter: "把条件写下来；满足才动，不满足就把手拿开。",
  },
};

const SCORED_QUESTIONS: ScoredQuestion[] = [
  question("buy", "impulse", 0, "你第一次认真看上这只票，最接近下面哪个原因？", [
    option("A", "连涨三天，再不买怕彻底上不了车。", { fomo: 2 }),
    option("B", "群里几个高手突然同时提到。", { herd: 2 }),
    option("C", "比高点跌了 40%，感觉已经够便宜。", { bottom: 2 }),
  ]),
  question("buy", "impulse", 1, "它今天突然涨停，哪句话最容易让你按下买入？", [
    option("A", "强者恒强，这已经证明趋势了。", { fomo: 2, overconfidence: 1 }),
    option("B", "龙头就该有信仰，犹豫的人赚不到。", { overconfidence: 2, fomo: 1 }),
    option("C", "大 V 说这只是第二波起点。", { herd: 2, fomo: 1 }),
  ]),
  question("buy", "evidence", 0, "下单前，你看到一条逻辑完整的反对观点：", [
    option("A", "坏消息肯定早就 Price in 了。", { overconfidence: 2 }),
    option("B", "群里高手都没提，应该不重要。", { herd: 2 }),
    option("C", "把它写进“不买条件”，重新判断。", { brake: 1 }),
  ]),
  question("buy", "evidence", 1, "哪条信息最能让你对这笔买入感到安心？", [
    option("A", "群里大多数人都得出了相同结论。", { herd: 2 }),
    option("B", "最近涨得这么强，说明资金已经验证。", { fomo: 2, overconfidence: 1 }),
    option("C", "我能明确说出什么事实出现时不再买。", { brake: 1 }),
  ]),
  question("buy", "plan", 0, "开盘价比你原计划买点高了 8%：", [
    option("A", "先买一半，至少别完全踏空。", { fomo: 2, drift: 1 }),
    option("B", "把目标价调高一点，空间又有了。", { drift: 2, overconfidence: 1 }),
    option("C", "今天错过，算计划正常失效。", { brake: 1 }),
  ]),
  question("buy", "plan", 1, "原计划最多买两成仓，但你现在越来越确信：", [
    option("A", "难得看准一次，可以直接加到五成。", { overconfidence: 2, drift: 1 }),
    option("B", "先买两成，跌了再继续加，迟早能摊平。", { bottom: 2, overconfidence: 1 }),
    option("C", "确信程度不能替代仓位上限。", { brake: 1 }),
  ]),
  question("buy", "regret", 0, "你刚在这只票上止损，第二天它就大涨：", [
    option("A", "立刻买回来，证明原来的判断没错。", { recovery: 2, fomo: 1 }),
    option("B", "以后再也不碰，省得继续打脸。", { loss: 2 }),
    option("C", "当成一笔新交易，重新计算条件。", { brake: 1 }),
  ]),
  question("buy", "regret", 1, "上一只股票你踏空了 30%，现在出现一只很像的：", [
    option("A", "这次一定要把错过的利润赚回来。", { recovery: 2, fomo: 1 }),
    option("B", "先上车再研究，不能连续错过两次。", { fomo: 2, drift: 1 }),
    option("C", "错过的利润不是市场欠我的钱。", { brake: 1 }),
  ]),
  question("buy", "counterfactual", 0, "假设你买入后立刻下跌 8%，第一反应会是：", [
    option("A", "更便宜了，正好补一点。", { bottom: 2, recovery: 1 }),
    option("B", "反正准备长期拿，先不看了。", { loss: 2, drift: 1 }),
    option("C", "检查失败条件，而不是自动加仓。", { brake: 1 }),
  ]),
  question("buy", "counterfactual", 1, "假设它今天没有上涨，你还会认真研究它吗？", [
    option("A", "大概率不会，是涨幅让我注意到它。", { fomo: 2 }),
    option("B", "群里不讨论的话，我可能根本不知道。", { herd: 2 }),
    option("C", "会，因为买入逻辑和当天涨跌无关。", { brake: 1 }),
  ]),

  question("add", "impulse", 0, "持仓跌了 12%，你想加仓，最真实的理由是：", [
    option("A", "加完以后成本价会好看很多。", { recovery: 2 }),
    option("B", "已经跌这么多，性价比肯定更高。", { bottom: 2 }),
    option("C", "这里原本就是计划中的第二买点。", { brake: 1 }),
  ]),
  question("add", "impulse", 1, "持仓突然大跌，你脑中最先出现的是：", [
    option("A", "跌得越快，反弹通常越猛。", { bottom: 2 }),
    option("B", "再买一点，证明最初的判断并没有错。", { recovery: 2, overconfidence: 1 }),
    option("C", "先确认是否出现了买入时不知道的新事实。", { brake: 1 }),
  ]),
  question("add", "evidence", 0, "群里有人说“黄金坑，加仓就对了”：", [
    option("A", "大家判断差不多，应该错不了。", { herd: 2 }),
    option("B", "他说上次抄底很准，值得跟。", { herd: 2, overconfidence: 1 }),
    option("C", "只把它当线索，不改变仓位计划。", { brake: 1 }),
  ]),
  question("add", "evidence", 1, "公司没有发布明显坏消息，但股价一直跌：", [
    option("A", "市场这次明显看错了。", { overconfidence: 2 }),
    option("B", "主力大概率在洗盘，越跌越该拿住。", { overconfidence: 2, bottom: 1 }),
    option("C", "没看到坏消息，不等于风险没有变化。", { brake: 1 }),
  ]),
  question("add", "plan", 0, "原计划仓位上限已经用完：", [
    option("A", "这种机会不常有，可以破例。", { overconfidence: 2, drift: 1 }),
    option("B", "今天先不加，等再跌一点狠狠干。", { bottom: 2, overconfidence: 1 }),
    option("C", "仓位上限也是交易条件的一部分。", { brake: 1 }),
  ]),
  question("add", "plan", 1, "股价已经跌穿你原定的最后加仓位：", [
    option("A", "继续往下分批加，总会等到反弹。", { recovery: 2, drift: 1 }),
    option("B", "把持有周期改长，短期波动就不重要了。", { loss: 2, drift: 1 }),
    option("C", "原计划已经失效，停止加仓并重新判断。", { brake: 1 }),
  ]),
  question("add", "regret", 0, "加仓以后继续下跌：", [
    option("A", "再补一笔，把成本继续摊低。", { recovery: 2, bottom: 1 }),
    option("B", "暂时不看账户，等它自己回来。", { loss: 2 }),
    option("C", "检查逻辑是否失效，必要时反而减仓。", { brake: 1 }),
  ]),
  question("add", "regret", 1, "账户里的浮亏让你越来越难受：", [
    option("A", "加一点，亏损比例看起来会小些。", { recovery: 2 }),
    option("B", "先不处理，等情绪和价格一起恢复。", { loss: 2 }),
    option("C", "仓位由风险决定，不由账户颜色决定。", { brake: 1 }),
  ]),
  question("add", "counterfactual", 0, "假设你现在完全空仓，还会按当前价格买吗？", [
    option("A", "不会，但已经持有了，加仓不一样。", { recovery: 2, loss: 1 }),
    option("B", "会，毕竟已经研究和跟踪这么久。", { overconfidence: 2, drift: 1 }),
    option("C", "把它作为一笔全新的交易重新判断。", { brake: 1 }),
  ]),
  question("add", "counterfactual", 1, "假设软件暂时隐藏了你的成本价：", [
    option("A", "看不到成本，我反而不知道该不该加。", { recovery: 2 }),
    option("B", "只看跌幅也知道现在已经很便宜。", { bottom: 2 }),
    option("C", "成本属于过去，只评估未来风险收益。", { brake: 1 }),
  ]),

  question("sell", "impulse", 0, "持仓盈利 25%，今天突然高开：", [
    option("A", "先卖掉，落袋才算真的赚。", { loss: 2 }),
    option("B", "群里说主升浪才开始，继续拿。", { herd: 2, fomo: 1 }),
    option("C", "只看原来的退出条件是否出现。", { brake: 1 }),
  ]),
  question("sell", "impulse", 1, "持仓盘中突然下跌 8%，你最想做的是：", [
    option("A", "赶紧卖，免得一会儿亏得更多。", { loss: 2 }),
    option("B", "至少等它反弹一点再卖。", { recovery: 2 }),
    option("C", "检查预先定义的失败条件。", { brake: 1 }),
  ]),
  question("sell", "evidence", 0, "群里都说“这是最后一洗”：", [
    option("A", "再等一天，大家可能是对的。", { herd: 2 }),
    option("B", "趁便宜补一点，涨回来再卖。", { bottom: 2, overconfidence: 1 }),
    option("C", "先回答什么事实能证明逻辑已经错了。", { brake: 1 }),
  ]),
  question("sell", "evidence", 1, "你关注的大 V 坚持说“拿住，不要被洗出去”：", [
    option("A", "他研究得比我深，继续听他的。", { herd: 2 }),
    option("B", "越多人看空，越说明主力目的达到了。", { overconfidence: 2 }),
    option("C", "他的信心不能替代我的退出条件。", { brake: 1 }),
  ]),
  question("sell", "plan", 0, "持仓亏损 20%，刚好触及原定止损：", [
    option("A", "再等等，至少回本附近再卖。", { recovery: 2, loss: 1 }),
    option("B", "改成长线，基本面其实还不错。", { drift: 2, loss: 1 }),
    option("C", "执行止损，之后再重新评估。", { brake: 1 }),
  ]),
  question("sell", "plan", 1, "已经达到原定止盈位，但走势看起来仍然很强：", [
    option("A", "继续把目标价往上调，直到趋势结束。", { drift: 2, fomo: 1 }),
    option("B", "趁强势再加仓，涨高一点一起卖。", { overconfidence: 2, fomo: 1 }),
    option("C", "执行原计划，或只使用事先约定的移动止盈。", { brake: 1 }),
  ]),
  question("sell", "regret", 0, "两只股票必须卖掉一只：", [
    option("A", "卖盈利的，亏损的再等等。", { loss: 2, recovery: 1 }),
    option("B", "卖亏损的，马上去追更强的那只。", { fomo: 2 }),
    option("C", "忘掉成本，只比较未来风险收益。", { brake: 1 }),
  ]),
  question("sell", "regret", 1, "买入逻辑已经明显变差，但账户还在亏损：", [
    option("A", "再拿一段，亏得少一点再卖。", { recovery: 2, loss: 1 }),
    option("B", "去群里找找支持继续持有的观点。", { herd: 2, loss: 1 }),
    option("C", "失败条件已出现，成本不参与决定。", { brake: 1 }),
  ]),
  question("sell", "counterfactual", 0, "你刚卖出，它第二天就大涨：", [
    option("A", "赶紧买回来，不能连续错两次。", { recovery: 2, fomo: 1 }),
    option("B", "再也不看它，免得越看越难受。", { loss: 2 }),
    option("C", "接受错过，重新出现条件才考虑。", { brake: 1 }),
  ]),
  question("sell", "counterfactual", 1, "假设你今天完全没有持仓，还会按现价买入吗？", [
    option("A", "不会，但现在卖掉就等于承认错了。", { loss: 2, recovery: 1 }),
    option("B", "会，毕竟已经拿了这么久，逻辑总会兑现。", { drift: 2, overconfidence: 1 }),
    option("C", "会不会买和该不该继续持有，使用同一套证据。", { brake: 1 }),
  ]),
];

const copy = (text: string, thought: string, relief: string) => ({ text, thought, relief });

const QUESTION_COPY: Record<string, QuestionCopy> = {
  "buy-impulse-a": {
    prompt: "一只票连涨三天，你终于把它加入自选。手指发热的真正原因是？",
    options: [
      copy("再不买，等它翻倍我得恨自己一辈子。", "怕的不是亏，是别人赚", "先上车再补票"),
      copy("群里三个“老师”同时说主升浪来了。", "三人成研报", "大家都买我就稳"),
      copy("从高点腰斩，地板价还要什么自行车。", "别人恐惧我贪婪", "底被我抄到了"),
    ],
  },
  "buy-impulse-b": {
    prompt: "机器人、算力、商业航天突然一起涨，你最想按下买入是因为？",
    options: [
      copy("这是时代主线，再慢一步就是错过国运。", "万物皆可新质生产力", "时代替我背书"),
      copy("三个热点叠加，龙头必须有信仰。", "概念越多，逻辑越硬", "梭哈就是格局"),
      copy("脱口秀都讲到它了，群众基础已经打好。", "段子也是催化剂", "笑着把单下了"),
    ],
  },
  "buy-evidence-a": {
    prompt: "下单前，一条逻辑完整的反对观点突然出现在你面前：",
    options: [
      copy("利空落地就是利好，坏消息早已 Price in。", "不要怕，技术性调整", "利空也能当利好"),
      copy("群里没人当回事，说明这件事不重要。", "沉默就是共识", "群友替我读完了"),
      copy("先写进不买条件，再把证据核对一次。", "慢一点不会死", "今天先不交学费"),
    ],
  },
  "buy-evidence-b": {
    prompt: "公司澄清：AI、机器人业务尚未形成收入。群里却说利空出尽：",
    options: [
      copy("没说没有，只是暂时没有，预期最重要。", "先有概念，再有收入", "预期替我买单"),
      copy("这么多公司都在澄清，说明这条线真热。", "欲盖弥彰，肯定有戏", "共识再次获胜"),
      copy("先看订单、收入和现金流，再决定。", "公告比群聊字小但更硬", "先看财报"),
    ],
  },
  "buy-plan-a": {
    prompt: "开盘价比计划买点高了 8%，你给自己找的台阶是：",
    options: [
      copy("先买一半，踏空比套牢更让我睡不着。", "先上车再研究", "车门夹住也算上车"),
      copy("目标价顺手上调，空间不就又出来了。", "估值是可调参数", "计划已自动适配"),
      copy("高出计划 8%，今天错过算正常失效。", "错过不是亏损", "手终于没乱动"),
    ],
  },
  "buy-plan-b": {
    prompt: "原计划只买两成，但群里说这是“AI 信仰重估”的最后窗口：",
    options: [
      copy("时代级机会不能小仓位，直接五成表示尊重。", "仓位就是认知", "信仰成功充值"),
      copy("先买两成，跌了再加，算力迟早会回来。", "越跌性价比越高", "后路也想好了"),
      copy("主题再大，也不能替我修改仓位上限。", "热点不负责赔钱", "上限还活着"),
    ],
  },
  "buy-regret-a": {
    prompt: "昨天止损，今天一字涨停，软件还特意推送给你。你会：",
    options: [
      copy("立刻买回来，才刚卖出就起飞不能忍。", "市场在针对我", "追回尊严再说"),
      copy("删掉自选，以后再碰它我就是狗。", "眼不见就没卖飞", "情绪已经拉黑"),
      copy("当成新交易重算，昨天的卖出不参与。", "错过不等于做错", "旧账就此作废"),
    ],
  },
  "buy-regret-b": {
    prompt: "上一只 AI 票踏空 30%，现在机器人龙头也开始加速：",
    options: [
      copy("同一个时代不能错过两次，这次赚回来。", "市场欠我一段主升", "补票成功"),
      copy("先上车再研究，等财报就没我位置了。", "研究总能盘后补", "位置比逻辑重要"),
      copy("踏空利润不是资产，也不是市场欠款。", "没赚到不叫亏", "放过上一只票"),
    ],
  },
  "buy-counterfactual-a": {
    prompt: "买入后立刻跌 8%，绿色数字刚好覆盖你的勇气：",
    options: [
      copy("更便宜了，补一点把成本做漂亮。", "越跌越有价值", "成本线下来了"),
      copy("本来就是价值投资，先把软件卸载。", "看不见就是没亏", "正式成为长线"),
      copy("只检查失败条件，不自动加仓。", "价格不是命令", "先看证据"),
    ],
  },
  "buy-counterfactual-b": {
    prompt: "把今天涨幅、热搜和群聊都遮住，你还会研究它吗？",
    options: [
      copy("不会，是涨停让我第一次看见了它。", "红 K 线自带投研", "承认就是馋"),
      copy("群里不聊，我甚至不知道它做什么。", "群聊外接大脑", "老师替我选了"),
      copy("会，逻辑和今天涨不涨没有关系。", "热点可以关掉", "理由还能站住"),
    ],
  },
  "add-impulse-a": {
    prompt: "持仓跌了 12%，加仓键突然比止损键顺眼。最真实的理由是：",
    options: [
      copy("加完以后，成本价至少能好看一点。", "数字小点就没那么痛", "亏损比例变好看"),
      copy("跌这么多，性价比肯定自动提高。", "别人恐惧我贪婪", "又抄到一层底"),
      copy("这里原本就是计划中的第二买点。", "计划里真写过", "这次不是临时起意"),
    ],
  },
  "add-impulse-b": {
    prompt: "机器人板块突然回调，你的持仓躺在跌幅榜，脑中先出现：",
    options: [
      copy("涨得猛就该洗得狠，反弹一定更猛。", "不要怕，技术性调整", "洗盘替我解释"),
      copy("再买一点，证明我看懂的是产业趋势。", "仓位越大越正确", "观点得到增援"),
      copy("先看业绩、订单或行业事实有没有变化。", "题材不等于事实", "先查再补"),
    ],
  },
  "add-evidence-a": {
    prompt: "群里有人刷屏：“黄金坑，加仓就对了。”你最想相信：",
    options: [
      copy("大家判断都差不多，应该错不了。", "群体智慧不会接盘", "共识批准加仓"),
      copy("他上次抄底抓了地天板，这次继续跟。", "成功一次就是股神", "老师替我负责"),
      copy("只把喊单当线索，不修改仓位计划。", "喊单不写进计划", "耳朵听见，手没动"),
    ],
  },
  "add-evidence-b": {
    prompt: "公司说“商业航天业务占比不足 1%”，评论区开始计算星辰大海：",
    options: [
      copy("市场炒的是未来，公司只懂现在。", "星辰大海先算估值", "未来替现在结账"),
      copy("主力借澄清洗盘，越否认越有东西。", "澄清就是隐藏彩蛋", "洗盘逻辑闭环"),
      copy("占比不足就是不足，先按披露事实判断。", "宇宙很大，收入很小", "先回到地面"),
    ],
  },
  "add-plan-a": {
    prompt: "仓位上限已经用完，但跌停板上看起来全是便宜货：",
    options: [
      copy("机会不常有，纪律偶尔也该为大局让路。", "规则只防普通机会", "破例获本人批准"),
      copy("今天先不加，等再跌一点狠狠干。", "现金是最后一颗子弹", "抄底计划升级"),
      copy("上限不是建议，是这笔交易的一部分。", "满仓没有下一次", "子弹还在"),
    ],
  },
  "add-plan-b": {
    prompt: "跌穿最后加仓位，群里把“机器人”改口成“十年产业趋势”：",
    options: [
      copy("继续分批，总会等到产业兑现。", "下跌只是时间问题", "继续给判断续费"),
      copy("持有周期改成十年，短期就不重要。", "短线套牢自动长线", "周期修改成功"),
      copy("原计划已经失效，停止加仓并重算。", "下次一定从这次开始", "不给错误续杯"),
    ],
  },
  "add-regret-a": {
    prompt: "刚加完又跌 5%，账户像在提醒你不要停：",
    options: [
      copy("再补一笔，成本线还能继续往下拉。", "摊低就是回本捷径", "数字又好看了"),
      copy("关掉软件装死，等它自己长回来。", "关灯吃面，明天再说", "看不见，心不痛"),
      copy("逻辑失效就减，不让加仓变成摊牌。", "错了可以撤", "停止自我加码"),
    ],
  },
  "add-regret-b": {
    prompt: "中报预告不及预期，浮亏已经很难看。你准备：",
    options: [
      copy("加一点，亏损比例先变得体面。", "红不了就把绿摊薄", "账户美颜完成"),
      copy("业绩只是短期，等情绪和价格恢复。", "基本面也会技术调整", "继续装死"),
      copy("仓位由未来风险决定，不由成本颜色决定。", "财报比情绪硬", "先处理事实"),
    ],
  },
  "add-counterfactual-a": {
    prompt: "假设现在完全空仓，你会在这个位置重新买吗？",
    options: [
      copy("不会，但持有和加仓不是一回事。", "卖了就承认错", "继续持有不算买"),
      copy("会，研究这么久总不能白费。", "沉没成本也是成本", "时间替我背书"),
      copy("把它当陌生票，从零开始写理由。", "过去不投票", "成本价已静音"),
    ],
  },
  "add-counterfactual-b": {
    prompt: "软件把成本价藏起来，只显示公司和未来。你会：",
    options: [
      copy("看不到成本，我根本不知道该不该加。", "回本线才是导航", "成本就是信仰"),
      copy("只看跌幅也知道便宜，不用成本价。", "低处还能有多低", "价格替我估值"),
      copy("过去已经成交，只比较未来风险收益。", "成本不是基本面", "旧账不参会"),
    ],
  },
  "sell-impulse-a": {
    prompt: "盈利 25%，今天突然高开，利润像随时会逃走：",
    options: [
      copy("先卖掉，落袋才算真的属于我。", "再不跑就没了", "现金终于姓我"),
      copy("群里说主升才开始，卖了就是没格局。", "才刚卖出就起飞怎么办", "格局继续拿"),
      copy("只检查事先写好的退出条件。", "利润也不能改计划", "按规则，不按心跳"),
    ],
  },
  "sell-impulse-b": {
    prompt: "盘中突然跌 8%，分时图像一张病危通知书：",
    options: [
      copy("快跑，再等一分钟都可能跌停。", "现在跑还来得及吗", "先逃离现场"),
      copy("至少反弹一点再卖，不然太亏。", "要不要割……再等等", "把痛苦延后"),
      copy("先看失败条件是否真的触发。", "快跑也要有理由", "不被分时绑架"),
    ],
  },
  "sell-evidence-a": {
    prompt: "群里都说“最后一洗”，连表情包都很坚定：",
    options: [
      copy("再等一天，群众的眼睛可能真是雪亮的。", "这么多人不能一起错", "全群陪我站岗"),
      copy("趁便宜补一点，反弹后一起卖。", "先加仓再止损", "亏损方案：加码"),
      copy("先写出什么事实能证明逻辑已经错了。", "洗盘不是万能解释", "让事实说话"),
    ],
  },
  "sell-evidence-b": {
    prompt: "大 V 说“AI 信仰不能被一次中报击穿”，你准备：",
    options: [
      copy("他研究得深，继续拿住等兑现。", "老师还没跑我不跑", "信仰续费成功"),
      copy("越多人质疑，越说明主力洗得彻底。", "反对意见都是洗盘", "世界再次配合我"),
      copy("他的信心不能替代我的退出条件。", "大 V 不替我亏钱", "仓位归本人管理"),
    ],
  },
  "sell-plan-a": {
    prompt: "亏损 20%，正好触及你买入前写下的止损线：",
    options: [
      copy("再等等，回本附近我一定卖。", "割了就真亏了", "先不承认，舒服了"),
      copy("基本面没变，临时改成长线。", "下次一定按纪律", "周期一改，亏损消失"),
      copy("按计划卖出，错了再重新判断。", "认错也比装死便宜", "疼一下就结束"),
    ],
  },
  "sell-plan-b": {
    prompt: "达到止盈位，但走势仍强，群里刷屏“卖飞警告”：",
    options: [
      copy("目标价继续上调，趋势不结束就不卖。", "才刚卖出就起飞最痛", "止盈线已上移"),
      copy("趁强再加，涨高一点一起卖。", "利润就是安全垫", "盈利允许梭哈"),
      copy("按计划卖，或只用预先约定的移动止盈。", "卖飞不是做错", "计划完成交割"),
    ],
  },
  "sell-regret-a": {
    prompt: "两只票必须卖一只：一只盈利，一只深套。你会：",
    options: [
      copy("卖盈利的，亏损的还有回本任务。", "好孩子先变现", "亏损继续留级"),
      copy("卖亏损的，马上去追最强热点。", "割完立刻换龙头", "伤口用涨停覆盖"),
      copy("忘掉成本，只比较未来风险收益。", "盈亏不参与投票", "只留更值得的"),
    ],
  },
  "sell-regret-b": {
    prompt: "逻辑变差、账户还亏，股吧却给它加上“核聚变概念”：",
    options: [
      copy("再拿一段，至少少亏一点再走。", "事到如今最对不起家人", "把认错再延后"),
      copy("去找支持持有的帖子，万一它真沾边。", "谐音炒作也是逻辑", "证据已定向搜齐"),
      copy("失败条件已出现，成本和新梗都不参与。", "热点不能起死回生", "该结束就结束"),
    ],
  },
  "sell-counterfactual-a": {
    prompt: "刚卖出，第二天它起飞，软件推送还特意提醒你：",
    options: [
      copy("赶紧买回来，不能连续错两次。", "才刚卖出就起飞", "尊严已经追回"),
      copy("删掉自选，再也不看，眼不见心不痛。", "卖飞比亏钱还疼", "通知已永久关闭"),
      copy("接受错过，条件重新出现才考虑。", "错过不是负收益", "不追自己的尾巴"),
    ],
  },
  "sell-counterfactual-b": {
    prompt: "假设今天完全空仓，你还会按现价买入这只持仓吗？",
    options: [
      copy("不会，但卖掉就等于承认这些年白熬。", "十年炒股两茫茫", "继续熬就没白熬"),
      copy("会，拿这么久了，逻辑总会兑现。", "时间是我的朋友吧", "持仓年龄替我背书"),
      copy("买不买与留不留，使用同一套证据。", "持有不是特殊权利", "证据重新上桌"),
    ],
  },
};

export const QUESTIONS: Question[] = SCORED_QUESTIONS.map((item) => {
  const content = QUESTION_COPY[item.id];
  if (!content) throw new Error(`Missing copy for ${item.id}`);
  return {
    ...item,
    prompt: content.prompt,
    options: item.options.map((answer, index) => ({
      ...answer,
      ...content.options[index],
    })) as [Option, Option, Option],
  };
});

const QUESTION_BY_ID = new Map(QUESTIONS.map((item) => [item.id, item]));

const PATH_PRIORITY: Record<TradePath, Bias[]> = {
  buy: ["fomo", "overconfidence", "herd", "bottom", "drift", "recovery", "loss"],
  add: ["recovery", "bottom", "overconfidence", "drift", "loss", "herd", "fomo"],
  sell: ["loss", "recovery", "drift", "herd", "fomo", "overconfidence", "bottom"],
};

export function getQuestion(questionId: string): Question {
  const found = QUESTION_BY_ID.get(questionId);
  if (!found) throw new Error(`Unknown question: ${questionId}`);
  return found;
}

export function selectQuestions(
  path: TradePath,
  previous: Partial<Record<Gate, Variant>> = {},
): Question[] {
  return GATES.map((gate) => {
    const variant: Variant = previous[gate] === 0 ? 1 : 0;
    const found = QUESTIONS.find(
      (item) => item.path === path && item.gate === gate && item.variant === variant,
    );
    if (!found) throw new Error(`Missing question for ${path}/${gate}/${variant}`);
    return found;
  });
}

export function evaluateQuiz(path: TradePath, selections: Selection[]): QuizResult {
  const scores = Object.fromEntries(
    [...BIASES, "brake"].map((dimension) => [dimension, 0]),
  ) as Record<Dimension, number>;
  const primaryHits = Object.fromEntries(BIASES.map((bias) => [bias, 0])) as Record<
    Bias,
    number
  >;
  const gateScores = Object.fromEntries(
    GATES.map((gate) => [
      gate,
      Object.fromEntries(BIASES.map((bias) => [bias, 0])) as Record<Bias, number>,
    ]),
  ) as Record<Gate, Record<Bias, number>>;

  for (const selection of selections) {
    const item = getQuestion(selection.questionId);
    if (item.path !== path) throw new Error(`Question ${item.id} does not belong to ${path}`);
    const answer = item.options.find((candidate) => candidate.id === selection.optionId);
    if (!answer) throw new Error(`Unknown option ${selection.optionId} for ${item.id}`);

    for (const [dimension, points] of Object.entries(answer.scores) as [Dimension, number][]) {
      scores[dimension] += points;
      if (dimension !== "brake") {
        gateScores[item.gate][dimension] += points;
        if (points === 2) primaryHits[dimension] += 1;
      }
    }
  }

  const rankedBiases = [...BIASES].sort((left, right) => {
    const comparisons = [
      scores[right] - scores[left],
      primaryHits[right] - primaryHits[left],
      gateScores.counterfactual[right] - gateScores.counterfactual[left],
      gateScores.regret[right] - gateScores.regret[left],
      PATH_PRIORITY[path].indexOf(left) - PATH_PRIORITY[path].indexOf(right),
    ];
    return comparisons.find((value) => value !== 0) ?? 0;
  });

  const hidden = scores.brake >= 4 && scores[rankedBiases[0]] < 4;
  const primary: Bias | "brake" = hidden ? "brake" : rankedBiases[0];
  const secondary = hidden || scores[rankedBiases[1]] < 3 ? null : rankedBiases[1];
  const signature = `${path}:${selections.map((item) => `${item.questionId}:${item.optionId}`).join("|")}`;
  const hash = stableHash(signature);

  return {
    primary,
    secondary,
    scores,
    rankedBiases,
    tauntIndex: (hash % 3) as 0 | 1 | 2,
    marketCode: `${path === "buy" ? "B" : path === "add" ? "A" : "S"}-${hash
      .toString(32)
      .toUpperCase()
      .padStart(5, "0")
      .slice(-5)}`,
  };
}

export function encodeSharedResult(
  path: TradePath,
  questionIds: string[],
  selections: Selection[],
): string {
  if (questionIds.length !== GATES.length || new Set(questionIds).size !== GATES.length) {
    throw new Error("A shared result requires one question for every gate");
  }

  const questions = GATES.map((gate) => {
    const matches = questionIds.map(getQuestion).filter(
      (item) => item.path === path && item.gate === gate,
    );
    if (matches.length !== 1) throw new Error(`Invalid shared question set for ${path}/${gate}`);
    return matches[0];
  });
  const versions = questions.map((item) => item.variant).join("");
  const answers = questions.map((item) => {
    const matches = selections.filter((selection) => selection.questionId === item.id);
    if (matches.length !== 1 || !item.options.some((option) => option.id === matches[0].optionId)) {
      throw new Error(`Invalid shared answer for ${item.id}`);
    }
    return matches[0].optionId;
  }).join("");
  return new URLSearchParams({ p: path, v: versions, a: answers }).toString();
}

export function decodeSharedResult(search: string): SharedResult | null {
  const params = new URLSearchParams(search.startsWith("?") ? search.slice(1) : search);
  const path = params.get("p");
  const versions = params.get("v");
  const answers = params.get("a");
  if (
    (path !== "buy" && path !== "add" && path !== "sell") ||
    !versions ||
    !/^[01]{5}$/.test(versions) ||
    !answers ||
    !/^[ABC]{5}$/.test(answers)
  ) {
    return null;
  }

  const questions = GATES.map((gate, index) =>
    QUESTIONS.find(
      (item) =>
        item.path === path &&
        item.gate === gate &&
        item.variant === Number(versions[index]),
    ),
  );
  if (questions.some((item) => !item)) return null;

  const resolved = questions as Question[];
  return {
    path,
    questionIds: resolved.map((item) => item.id),
    selections: resolved.map((item, index) => ({
      questionId: item.id,
      optionId: answers[index] as Option["id"],
    })),
  };
}

const PERSONA_BASE_SHARE: Record<Dimension, number> = {
  recovery: 20,
  loss: 18,
  fomo: 15,
  bottom: 14,
  herd: 12,
  drift: 10,
  overconfidence: 8,
  brake: 3,
};

export function estimatePersonaShare(result: QuizResult): number {
  const primaryScore = result.scores[result.primary];
  const runnerScore = result.primary === "brake"
    ? Math.max(...BIASES.map((bias) => result.scores[bias]))
    : result.scores[result.rankedBiases[1]];
  const lead = Math.max(0, primaryScore - runnerScore);
  const estimate = Math.round(
    PERSONA_BASE_SHARE[result.primary]
      - Math.max(0, primaryScore - 4) * 0.8
      - Math.max(0, lead - 1) * 0.6,
  );
  return Math.min(24, Math.max(1, estimate));
}

export function personaShareCopy(result: QuizResult, percentage = estimatePersonaShare(result)): string {
  if (result.primary === "brake") {
    return "稀有到让镰刀集体失业：这次你居然在最后一秒把手收了回来。";
  }
  if (percentage <= 3) {
    return "恭喜你，A 股百里挑一的绝世好韭菜，镰刀见了都想申请合影。";
  }
  const oneIn = Math.max(2, Math.round(100 / percentage));
  if (percentage <= 8) {
    return `约每 ${oneIn} 根韭菜才有一根同款，你已经从散户进化成限定皮肤。`;
  }
  if (percentage <= 15) {
    return `约每 ${oneIn} 根韭菜就有一根同款，菜地里一喊，全是自己人。`;
  }
  return "别怕，你并不孤独；这片菜地里到处都是同款，只是大家都假装在独立思考。";
}

export function stableHash(value: string): number {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

export function shareText(result: QuizResult): string {
  const persona = PERSONAS[result.primary];
  const secondary = result.secondary ? `，副人格「${PERSONAS[result.secondary].name}」` : "";
  return `我的今日韭菜人格是「${persona.name}」${secondary}。${persona.taunts[result.tauntIndex]}来看看你下单时，手和脑子到底谁先涨停。`;
}
