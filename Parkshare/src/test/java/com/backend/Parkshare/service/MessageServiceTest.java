package com.backend.Parkshare.service;

import com.backend.Parkshare.model.Message;
import com.backend.Parkshare.repository.MessageRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class MessageServiceTest {

    @Mock
    private MessageRepository repository;

    @InjectMocks
    private MessageService service;

    @Test
    void send_stampsSenderAndTimestamp() {
        when(repository.save(any(Message.class))).thenAnswer(inv -> inv.getArgument(0));

        Message result = service.send("conv-1", "guest@example.com", "Hello");

        ArgumentCaptor<Message> captor = ArgumentCaptor.forClass(Message.class);
        verify(repository).save(captor.capture());
        Message saved = captor.getValue();

        assertEquals("conv-1", saved.getConversationId());
        assertEquals("guest@example.com", saved.getSenderEmail());
        assertEquals("Hello", saved.getBody());
        assertEquals(saved, result);
    }

    @Test
    void listInitial_reversesToChronologicalOrder() {
        Message newest = new Message();
        newest.setBody("newest");
        Message oldest = new Message();
        oldest.setBody("oldest");
        when(repository.findByConversationIdOrderBySentAtDesc(eq("conv-1"), any()))
                .thenReturn(new ArrayList<>(List.of(newest, oldest)));

        List<Message> result = service.listInitial("conv-1", 50);

        assertEquals("oldest", result.get(0).getBody());
        assertEquals("newest", result.get(1).getBody());
    }

    @Test
    void listSince_delegatesToRepository() {
        LocalDateTime since = LocalDateTime.of(2026, 11, 1, 0, 0);
        Message message = new Message();
        when(repository.findByConversationIdAndSentAtAfterOrderBySentAtAsc("conv-1", since))
                .thenReturn(List.of(message));

        List<Message> result = service.listSince("conv-1", since);

        assertEquals(1, result.size());
        assertEquals(message, result.get(0));
    }
}
