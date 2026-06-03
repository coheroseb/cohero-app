import SwiftUI

// --- Theorist Question Model ---
struct TheoristQuestion: Identifiable {
    let id: Int
    let theorist: String
    let questionText: String
    let options: [String]
    let correctIndex: Int
    let explanation: String
}

// --- Sample Questions ---
let sampleQuestions = [
    TheoristQuestion(
        id: 1,
        theorist: "Bourdieu",
        questionText: "En studerende har opnået et stort netværk af indflydelsesrige kontakter under sit studie. Hvilken kapitalform beskriver Bourdieu dette som?",
        options: [
            "Økonomisk kapital (Penge, ejendomme)",
            "Kulturel kapital (Uddannelse, titler)",
            "Socialt kapital (Relationer, netværk)",
            "Symbolsk kapital (Anerkendelse, prestige)"
        ],
        correctIndex: 2,
        explanation: "Social kapital handler om de ressourcer, man får adgang til gennem sit netværk, sine relationer og sociale forbindelser."
    ),
    TheoristQuestion(
        id: 2,
        theorist: "Bourdieu",
        questionText: "Hvad forstår Bourdieu ved begrebet 'Habitus'?",
        options: [
            "De midlertidige holdninger, man bevidst vælger",
            "Indlejrede kropslige vaner og adfærdsmønstre",
            "Det fysiske rum man befinder sig i",
            "Den samlede sum af de penge, man ejer"
        ],
        correctIndex: 1,
        explanation: "Habitus er de kropslige og mentale adfærdsmønstre, værdier og normer, vi ubevidst har taget til os gennem vores opvækst og baggrund."
    ),
    TheoristQuestion(
        id: 3,
        theorist: "Foucault",
        questionText: "Foucault bruger arkitekturen 'Panoptikon' som et billede på en særlig magtform. Hvilken?",
        options: [
            "Den voldelige, fysiske undertrykkelse",
            "Den usynlige, disciplinerende magt, hvor borgeren regulerer sig selv",
            "Den demokratiske magt gennem frie valg",
            "Den økonomiske magt som de rige har"
        ],
        correctIndex: 1,
        explanation: "Panoptikon-modellen beskriver, hvordan konstant (eller potentiel) overvågning fører til, at individer internaliserer magten og kontrollerer sig selv."
    ),
    TheoristQuestion(
        id: 4,
        theorist: "Foucault",
        questionText: "Hvad beskriver Foucault med begrebet 'Biomagt'?",
        options: [
            "Magt over biologiske våben",
            "Regulering og kontrol af befolkningens kroppe, sundhed og reproduktion",
            "Naturkræfternes indvirkning på mennesket",
            "Magten til at give dødsstraf"
        ],
        correctIndex: 1,
        explanation: "Biomagt refererer til statens og systemets kontrol over befolkningen som biologiske væsener – herunder sundhed, fødselstal og dødelighed."
    ),
    TheoristQuestion(
        id: 5,
        theorist: "Luhmann",
        questionText: "Ifølge Luhmanns systemteori, hvad består det sociale samfundssystem grundlæggende af?",
        options: [
            "De konkrete mennesker",
            "De fysiske bygninger, love og veje",
            "Kommunikationer (og ikke de enkelte individer selv)",
            "De politiske partier"
        ],
        correctIndex: 2,
        explanation: "For Luhmann er sociale systemer autopoietiske (selvskabende) systemer af kommunikation. Individer hører til i systemets omgivelser (psykiske systemer)."
    )
]

struct TheoristGameView: View {
    @Environment(\.presentationMode) var presentationMode
    let userId: String // Pass the logged-in user ID
    
    // Game States
    @State private var gameState: GameState = .welcome
    @State private var currentQIndex: Int = 0
    @State private var hearts: Int = 3
    @State private var selectedOption: Int? = nil
    @State private var hasAnswered: Bool = false
    @State private var isCorrect: Bool = false
    @State private var score: Int = 0
    @State private var isSaving: Bool = false
    
    enum GameState {
        case welcome, playing, completed, gameover
    }

    var body: some View {
        ZStack {
            Color(red: 0.98, green: 0.98, blue: 0.96)
                .ignoresSafeArea()
            
            VStack {
                // Header / HUD
                HStack {
                    Button(action: {
                        self.presentationMode.wrappedValue.dismiss()
                    }) {
                        HStack(spacing: 8) {
                            Image(systemName: "chevron.left")
                            Text("Tilbage")
                        }
                        .font(.system(.subheadline, design: .rounded).bold())
                        .foregroundColor(.secondary)
                        .padding(.horizontal, 16)
                        .padding(.vertical, 8)
                        .background(Color.white)
                        .cornerRadius(20)
                        .shadow(color: Color.black.opacity(0.03), radius: 5, x: 0, y: 2)
                    }
                    
                    Spacer()
                    
                    if gameState == .playing {
                        HStack(spacing: 6) {
                            ForEach(1...3, id: \.self) { index in
                                Image(systemName: "heart.fill")
                                    .font(.title3)
                                    .foregroundColor(hearts >= index ? .red : .gray.opacity(0.2))
                                    .scaleEffect(hearts >= index ? 1.1 : 0.9)
                                    .animation(.spring(response: 0.3, dampingFraction: 0.5), value: hearts)
                             }
                        }
                    }
                }
                .padding(.horizontal)
                .padding(.top, 16)
                
                Spacer()
                
                // MAIN VIEWS BASED ON GAMESTATE
                switch gameState {
                case .welcome:
                    welcomeView
                case .playing:
                    questionView
                case .completed:
                    completedView
                case .gameover:
                    gameoverView
                }
                
                Spacer()
            }
        }
        .navigationBarHidden(true)
    }
    
    // --- 1. WELCOME VIEW ---
    var welcomeView: some View {
        VStack(spacing: 30) {
            ZStack {
                Circle()
                    .fill(Color.orange.opacity(0.1))
                    .frame(width: 100, height: 100)
                Image(systemName: "flame.fill")
                    .font(.system(size: 50))
                    .foregroundColor(.orange)
            }
            
            VStack(spacing: 12) {
                Text("Daglig Udfordring")
                    .font(.system(.caption, design: .rounded).bold())
                    .foregroundColor(.indigo)
                    .tracking(3)
                
                Text("Dagens Teoretiker-Spil")
                    .font(.system(.title, design: .serif).bold())
                    .foregroundColor(.primary)
                
                Text("Velkommen til dagens akademiske udfordring! Her dyster du i forståelsen af socialrådgiver-studiets største sværvægtere: Bourdieu, Foucault og Luhmann.")
                    .font(.system(.subheadline, design: .rounded))
                    .foregroundColor(.secondary)
                    .multilineTextAlignment(.center)
                    .lineSpacing(4)
                    .padding(.horizontal, 20)
            }
            
            HStack(spacing: 16) {
                Image(systemName: "award.fill")
                    .font(.largeTitle)
                    .foregroundColor(.orange)
                
                VStack(alignment: .leading, spacing: 4) {
                    Text("Gennemfør & vind belønning")
                        .font(.system(.subheadline, design: .rounded).bold())
                    Text("+25 COHÉRO POINTS • +1 STREAK DAG")
                        .font(.system(.caption2, design: .rounded).bold())
                        .foregroundColor(.secondary)
                }
            }
            .padding()
            .background(Color.white)
            .cornerRadius(24)
            .shadow(color: Color.black.opacity(0.02), radius: 10)
            
            Button(action: startGame) {
                HStack {
                    Text("START SPILLET")
                        .font(.system(.headline, design: .rounded).bold())
                        .tracking(1.5)
                    Image(systemName: "arrow.right")
                }
                .foregroundColor(.white)
                .frame(maxWidth: .infinity)
                .frame(height: 64)
                .background(Color.black)
                .cornerRadius(20)
                .shadow(color: Color.black.opacity(0.15), radius: 10, y: 5)
            }
            .padding(.horizontal, 24)
        }
        .padding()
    }
    
    // --- 2. PLAYING VIEW ---
    var questionView: some View {
        let question = sampleQuestions[currentQIndex]
        
        return VStack(spacing: 24) {
            // Progress Bar
            VStack(alignment: .leading, spacing: 8) {
                HStack {
                    Text("Opgave \(currentQIndex + 1) af \(sampleQuestions.count)")
                        .font(.system(.caption, design: .rounded).bold())
                        .foregroundColor(.secondary)
                    Spacer()
                    Text(question.theorist)
                        .font(.system(.caption, design: .rounded).bold())
                        .foregroundColor(.indigo)
                }
                
                GeometryReader { geo in
                    ZStack(alignment: .leading) {
                        Capsule()
                            .fill(Color.gray.opacity(0.1))
                            .frame(height: 8)
                        
                        Capsule()
                            .fill(Color.indigo)
                            .frame(width: geo.size.width * CGFloat(currentQIndex + 1) / CGFloat(sampleQuestions.count), height: 8)
                            .animation(.spring(), value: currentQIndex)
                    }
                }
                .frame(height: 8)
            }
            .padding(.horizontal, 24)
            
            // Question Card
            VStack(spacing: 20) {
                Text(question.questionText)
                    .font(.system(.title3, design: .serif).bold())
                    .foregroundColor(.primary)
                    .lineSpacing(4)
                    .multilineTextAlignment(.leading)
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .padding()
                    .background(Color.white)
                    .cornerRadius(32)
                    .shadow(color: Color.black.opacity(0.02), radius: 15)
                
                // Options List
                VStack(spacing: 12) {
                    ForEach(0..<question.options.count, id: \.self) { idx in
                        Button(action: { selectOption(idx) }) {
                            HStack(spacing: 16) {
                                Text(["A", "B", "C", "D"][idx])
                                    .font(.system(.subheadline, design: .rounded).bold())
                                    .foregroundColor(selectedOption == idx ? .white : .indigo)
                                    .frame(width: 32, height: 32)
                                    .background(selectedOption == idx ? Color.indigo : Color.indigo.opacity(0.08))
                                    .cornerRadius(10)
                                
                                Text(question.options[idx])
                                    .font(.system(.subheadline, design: .rounded))
                                    .fontWeight(.semibold)
                                    .foregroundColor(.primary)
                                    .multilineTextAlignment(.leading)
                                    .lineSpacing(3)
                                Spacer()
                            }
                            .padding()
                            .frame(maxWidth: .infinity)
                            .background(optionBackground(idx: idx))
                            .cornerRadius(20)
                            .overlay(
                                RoundedRectangle(cornerRadius: 20)
                                    .stroke(optionBorder(idx: idx), lineWidth: 2)
                            )
                        }
                        .disabled(hasAnswered)
                    }
                }
            }
            .padding(.horizontal, 24)
            
            // Answer Drawers / Check Button
            VStack(spacing: 16) {
                if !hasAnswered {
                    Button(action: checkAnswer) {
                        Text("SVAR & TJEK")
                            .font(.system(.subheadline, design: .rounded).bold())
                            .tracking(1.5)
                            .foregroundColor(.white)
                            .frame(maxWidth: .infinity)
                            .frame(height: 64)
                            .background(selectedOption == nil ? Color.gray.opacity(0.2) : Color.indigo)
                            .cornerRadius(20)
                            .shadow(color: selectedOption == nil ? Color.clear : Color.indigo.opacity(0.2), radius: 10, y: 5)
                    }
                    .disabled(selectedOption == nil)
                } else {
                    // Sliding drawer feedback
                    VStack(alignment: .leading, spacing: 8) {
                        HStack {
                            Image(systemName: isCorrect ? "checkmark.circle.fill" : "xmark.circle.fill")
                                .font(.title2)
                                .foregroundColor(isCorrect ? .emerald : .rose)
                            Text(isCorrect ? "Helt rigtigt! 🥳" : "Hov, ikke helt rigtigt... 😢")
                                .font(.system(.headline, design: .rounded).bold())
                                .foregroundColor(isCorrect ? .emerald : .rose)
                        }
                        
                        Text(question.explanation)
                            .font(.system(.caption, design: .rounded))
                            .fontWeight(.medium)
                            .lineSpacing(3)
                            .foregroundColor(.primary.opacity(0.8))
                        
                        Button(action: nextQuestion) {
                            HStack {
                                Text("NÆSTE OPGAVE")
                                    .font(.system(.caption, design: .rounded).bold())
                                    .tracking(1.5)
                                Image(systemName: "arrow.right")
                            }
                            .foregroundColor(.white)
                            .frame(maxWidth: .infinity)
                            .frame(height: 54)
                            .background(Color.black)
                            .cornerRadius(16)
                            .padding(.top, 8)
                        }
                    }
                    .padding(24)
                    .background(isCorrect ? Color.emerald.opacity(0.08) : Color.rose.opacity(0.08))
                    .cornerRadius(28)
                    .overlay(
                        RoundedRectangle(cornerRadius: 28)
                            .stroke(isCorrect ? Color.emerald.opacity(0.2) : Color.rose.opacity(0.2), lineWidth: 1.5)
                    )
                    .transition(.move(edge: .bottom).combined(with: .opacity))
                }
            }
            .padding(.horizontal, 24)
        }
    }
    
    // --- 3. COMPLETED VIEW ---
    var completedView: some View {
        VStack(spacing: 32) {
            ZStack {
                Circle()
                    .fill(Color.indigo.opacity(0.1))
                    .frame(width: 120, height: 120)
                Image(systemName: "trophy.fill")
                    .font(.system(size: 55))
                    .foregroundColor(.indigo)
            }
            
            VStack(spacing: 12) {
                Text("Udfordring Gennemført!")
                    .font(.system(.caption, design: .rounded).bold())
                    .foregroundColor(.emerald)
                    .tracking(2)
                
                Text("Tillykke! 🏆")
                    .font(.system(.largeTitle, design: .serif).bold())
                    .foregroundColor(.primary)
                
                Text("Du har besvaret alle opgaver i dagens teoretiker-spil korrekt! Du har vist stor forståelse for de faglige begreber.")
                    .font(.system(.subheadline, design: .rounded))
                    .foregroundColor(.secondary)
                    .multilineTextAlignment(.center)
                    .lineSpacing(4)
                    .padding(.horizontal, 24)
            }
            
            HStack(spacing: 16) {
                VStack(spacing: 4) {
                    Image(systemName: "flame.fill")
                        .font(.title2)
                        .foregroundColor(.orange)
                    Text("Streak Opdateret")
                        .font(.system(.system(size: 9), design: .rounded).bold())
                        .foregroundColor(.secondary)
                    Text("+1 dag")
                        .font(.system(.title3, design: .serif).bold())
                        .foregroundColor(.orange)
                }
                .frame(maxWidth: .infinity)
                .padding()
                .background(Color.orange.opacity(0.05))
                .cornerRadius(20)
                .overlay(RoundedRectangle(cornerRadius: 20).stroke(Color.orange.opacity(0.15), lineWidth: 1))
                
                VStack(spacing: 4) {
                    Image(systemName: "award.fill")
                        .font(.title2)
                        .foregroundColor(.indigo)
                    Text("Vundet Point")
                        .font(.system(.system(size: 9), design: .rounded).bold())
                        .foregroundColor(.secondary)
                    Text("+25 pt")
                        .font(.system(.title3, design: .serif).bold())
                        .foregroundColor(.indigo)
                }
                .frame(maxWidth: .infinity)
                .padding()
                .background(Color.indigo.opacity(0.05))
                .cornerRadius(20)
                .overlay(RoundedRectangle(cornerRadius: 20).stroke(Color.indigo.opacity(0.15), lineWidth: 1))
            }
            .padding(.horizontal, 24)
            
            Button(action: saveChallengeProgress) {
                HStack {
                    if isSaving {
                        ProgressView()
                            .progressViewStyle(CircularProgressViewStyle(tint: .white))
                    } else {
                        Text("INDLØS BELØNNING")
                            .font(.system(.headline, design: .rounded).bold())
                            .tracking(1.5)
                        Image(systemName: "checkmark.circle.fill")
                    }
                }
                .foregroundColor(.white)
                .frame(maxWidth: .infinity)
                .frame(height: 64)
                .background(Color.black)
                .cornerRadius(20)
                .shadow(color: Color.black.opacity(0.15), radius: 10, y: 5)
            }
            .disabled(isSaving)
            .padding(.horizontal, 24)
        }
    }
    
    // --- 4. GAME OVER VIEW ---
    var gameoverView: some View {
        VStack(spacing: 30) {
            ZStack {
                Circle()
                    .fill(Color.red.opacity(0.1))
                    .frame(width: 100, height: 100)
                Image(systemName: "xmark.circle.fill")
                    .font(.system(size: 50))
                    .foregroundColor(.red)
            }
            
            VStack(spacing: 12) {
                Text("Prøv Igen")
                    .font(.system(.caption, design: .rounded).bold())
                    .foregroundColor(.red)
                    .tracking(3)
                
                Text("Du tabte alle dine liv")
                    .font(.system(.title, design: .serif).bold())
                    .foregroundColor(.primary)
                
                Text("Det var desværre tæt på! Men bare rolig – teorier som Bourdieu og Luhmann er svære. Prøv igen med det samme!")
                    .font(.system(.subheadline, design: .rounded))
                    .foregroundColor(.secondary)
                    .multilineTextAlignment(.center)
                    .lineSpacing(4)
                    .padding(.horizontal, 20)
            }
            
            VStack(spacing: 12) {
                Button(action: startGame) {
                    HStack {
                        Image(systemName: "arrow.clockwise")
                        Text("PRØV IGEN")
                            .font(.system(.headline, design: .rounded).bold())
                            .tracking(1.5)
                    }
                    .foregroundColor(.white)
                    .frame(maxWidth: .infinity)
                    .frame(height: 64)
                    .background(Color.black)
                    .cornerRadius(20)
                }
                
                Button(action: {
                    self.presentationMode.wrappedValue.dismiss()
                }) {
                    Text("Måske senere")
                        .font(.system(.subheadline, design: .rounded).bold())
                        .foregroundColor(.secondary)
                        .padding()
                }
            }
            .padding(.horizontal, 24)
        }
    }
    
    // --- HELPER FUNCTIONS & COLOR HANDLING ---
    func startGame() {
        triggerHaptic(style: .medium)
        gameState = .playing
        currentQIndex = 0
        hearts = 3
        score = 0
        selectedOption = nil
        hasAnswered = false
    }
    
    func selectOption(_ idx: Int) {
        triggerHaptic(style: .light)
        selectedOption = idx
    }
    
    func checkAnswer() {
        guard let selected = selectedOption else { return }
        
        let correct = selected == sampleQuestions[currentQIndex].correctIndex
        isCorrect = correct
        hasAnswered = true
        
        if correct {
            triggerHaptic(style: .heavy)
            score += 1
        } else {
            triggerHaptic(style: .medium)
            hearts -= 1
            if hearts == 0 {
                DispatchQueue.main.asyncAfter(deadline: .now() + 1.5) {
                    self.gameState = .gameover
                }
            }
        }
    }
    
    func nextQuestion() {
        selectedOption = nil
        hasAnswered = false
        
        if currentQIndex + 1 < sampleQuestions.count {
            currentQIndex += 1
        } else {
            gameState = .completed
            triggerHaptic(style: .heavy)
        }
    }
    
    func triggerHaptic(style: UIImpactFeedbackGenerator.FeedbackStyle) {
        let generator = UIImpactFeedbackGenerator(style: style)
        generator.prepare()
        generator.impactOccurred()
    }
    
    func saveChallengeProgress() {
        isSaving = true
        triggerHaptic(style: .medium)
        
        // POST to your Next.js API endpoint to save progress securely
        let url = URL(string: "https://student.cohero.dk/api/challenge/complete")!
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        
        let body: [String: Any] = ["userId": userId]
        request.httpBody = try? JSONSerialization.data(withJSONObject: body)
        
        URLSession.shared.dataTask(with: request) { data, response, error in
            DispatchQueue.main.async {
                self.isSaving = false
                // On success or fallback, return to portal
                self.presentationMode.wrappedValue.dismiss()
            }
        }.resume()
    }
    
    // UI Theme helpers
    func optionBackground(idx: Int) -> Color {
        guard hasAnswered else {
            return selectedOption == idx ? Color.indigo.opacity(0.04) : Color.white
        }
        if idx == sampleQuestions[currentQIndex].correctIndex {
            return Color.emerald.opacity(0.05)
        }
        if selectedOption == idx {
            return Color.rose.opacity(0.05)
        }
        return Color.white.opacity(0.5)
    }
    
    func optionBorder(idx: Int) -> Color {
        guard hasAnswered else {
            return selectedOption == idx ? Color.indigo : Color.clear
        }
        if idx == sampleQuestions[currentQIndex].correctIndex {
            return Color.emerald
        }
        if selectedOption == idx {
            return Color.rose
        }
        return Color.clear
    }
}

// Custom Colors Helpers
extension Color {
    static let emerald = Color(red: 0.06, green: 0.6, blue: 0.35)
    static let rose = Color(red: 0.95, green: 0.25, blue: 0.37)
}
