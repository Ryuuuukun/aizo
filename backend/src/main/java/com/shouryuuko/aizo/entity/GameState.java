@Entity
@Getter
@Setter
@Table(name = "game_states")
public class GameState {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne
    @JoinColumn(name = "session_id", unique = true)
    private GameSession session;

    @LOB
    private String boardData;

    @Version
    private Integer version;

    private LocalDateTime updatedAt;
}