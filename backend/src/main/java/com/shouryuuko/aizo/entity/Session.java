@Entity
@Table(name = "game_sessions")
public class Session {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "creator_id", nullable = false)
    private User creator;

    @ManyToOne
    @JoinColumn(name = "opponent_id")
    private User opponent;

    @Enumerated(EnumType.STRING)
    private GameStatus status;

    private Integer boardSize;

    @ManyToOne
    @JoinColumn(name = "current_player_id")
    private User currentPlayer;

    private LocalDateTime createdAt;

    private LocalDateTime startedAt;

    private LocalDateTime finishedAt;
}