package com.campus.errand;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class OrderLifecycleTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Test
    void completeOrderFlowShouldSettleWalletAndAllowReview() throws Exception {
        String publisherToken = login("student1", "123456");
        String runnerToken = login("runner1", "123456");
        String pendingRunnerToken = login("runner2", "123456");

        BigDecimal publisherBefore = balance(publisherToken);
        BigDecimal runnerBefore = balance(runnerToken);

        JsonNode published = publishOrder(publisherToken, "集成测试：帮取快递", "EXPRESS", 1, "6.5");
        long orderId = published.path("id").asLong();
        assertThat(orderId).isPositive();
        assertThat(published.path("status").asText()).isEqualTo("PENDING");
        assertThat(published.path("amount").decimalValue()).isEqualByComparingTo("7.00");
        assertThat(published.path("runnerIncome").decimalValue()).isEqualByComparingTo("6.30");
        assertThat(published.path("canCancel").asBoolean()).isTrue();
        assertThat(balance(publisherToken)).isEqualByComparingTo(publisherBefore.subtract(new BigDecimal("7.00")));

        mockMvc.perform(post("/api/orders/{id}/accept", orderId)
                        .header("Authorization", "Bearer " + pendingRunnerToken))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.message").value("请先通过跑腿员认证后再接单"));

        mockMvc.perform(post("/api/orders/{id}/accept", orderId)
                        .header("Authorization", "Bearer " + runnerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.status").value("ACCEPTED"))
                .andExpect(jsonPath("$.data.runnerName").value("阿凯"))
                .andExpect(jsonPath("$.data.canPickup").value(true));

        mockMvc.perform(post("/api/orders/{id}/accept", orderId)
                        .header("Authorization", "Bearer " + runnerToken))
                .andExpect(status().isConflict());

        mockMvc.perform(post("/api/orders/{id}/pickup", orderId)
                        .header("Authorization", "Bearer " + runnerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.status").value("PICKED_UP"));

        mockMvc.perform(post("/api/orders/{id}/deliver", orderId)
                        .header("Authorization", "Bearer " + runnerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.status").value("DELIVERED"));

        mockMvc.perform(post("/api/orders/{id}/complete", orderId)
                        .header("Authorization", "Bearer " + publisherToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.status").value("COMPLETED"))
                .andExpect(jsonPath("$.data.payStatus").value("SETTLED"))
                .andExpect(jsonPath("$.data.canReview").value(true));

        assertThat(balance(runnerToken)).isEqualByComparingTo(runnerBefore.add(new BigDecimal("6.30")));

        mockMvc.perform(post("/api/orders/{id}/review", orderId)
                        .header("Authorization", "Bearer " + publisherToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "rating", 5,
                                "content", "集成测试评价：服务很好",
                                "anonymous", 0))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.rating").value(5));

        mockMvc.perform(post("/api/orders/{id}/review", orderId)
                        .header("Authorization", "Bearer " + publisherToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("rating", 4, "content", "重复评价"))))
                .andExpect(status().isConflict());

        mockMvc.perform(get("/api/orders/{id}", orderId)
                        .header("Authorization", "Bearer " + publisherToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.review.rating").value(5))
                .andExpect(jsonPath("$.data.logs.length()").value(6));

        mockMvc.perform(get("/api/notifications/unread-count")
                        .header("Authorization", "Bearer " + runnerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.count").isNumber());
    }

    @Test
    void cancelPendingOrderShouldRefundPublisher() throws Exception {
        String token = login("student2", "123456");
        BigDecimal before = balance(token);
        JsonNode order = publishOrder(token, "集成测试：取消订单", "PRINT", 0, "1.0");
        long orderId = order.path("id").asLong();
        BigDecimal amount = order.path("amount").decimalValue();

        mockMvc.perform(post("/api/orders/{id}/cancel", orderId)
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"reason\":\"集成测试取消\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.status").value("CANCELLED"))
                .andExpect(jsonPath("$.data.payStatus").value("REFUNDED"));

        assertThat(balance(token)).isEqualByComparingTo(before);
    }

    @Test
    void adminCanCancelAcceptedOrderAndRefund() throws Exception {
        String publisherToken = login("student1", "123456");
        String runnerToken = login("runner1", "123456");
        String adminToken = login("admin", "admin123");
        BigDecimal before = balance(publisherToken);
        long orderId = publishOrder(publisherToken, "集成测试：管理员取消", "FOOD", 0, "1.0")
                .path("id").asLong();
        BigDecimal amount = new BigDecimal("4.00");

        mockMvc.perform(post("/api/orders/{id}/accept", orderId)
                        .header("Authorization", "Bearer " + runnerToken))
                .andExpect(status().isOk());

        mockMvc.perform(post("/api/admin/orders/{id}/cancel", orderId)
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"reason\":\"管理员集成测试取消\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.status").value("CANCELLED"));

        assertThat(balance(publisherToken)).isEqualByComparingTo(before.subtract(amount).add(amount));
    }

    private JsonNode publishOrder(String token, String title, String type,
                                  int urgent, String weight) throws Exception {
        ObjectNode body = objectMapper.createObjectNode();
        body.put("type", type);
        body.put("title", title);
        body.put("description", "自动化测试订单");
        body.put("pickupAddress", "测试取件点");
        body.put("deliveryAddress", "测试送达点");
        body.put("contactName", "测试同学");
        body.put("contactPhone", "13800000002");
        body.put("expectedTime", LocalDateTime.now().plusHours(3).withNano(0).toString());
        body.put("urgent", urgent);
        body.put("weight", weight);

        MvcResult result = mockMvc.perform(post("/api/orders")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(body)))
                .andExpect(status().isOk())
                .andReturn();
        return objectMapper.readTree(result.getResponse().getContentAsString()).path("data");
    }

    private BigDecimal balance(String token) throws Exception {
        MvcResult result = mockMvc.perform(get("/api/user/profile")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andReturn();
        return objectMapper.readTree(result.getResponse().getContentAsString())
                .path("data").path("balance").decimalValue();
    }

    private String login(String username, String password) throws Exception {
        MvcResult result = mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "username", username, "password", password))))
                .andExpect(status().isOk())
                .andReturn();
        return objectMapper.readTree(result.getResponse().getContentAsString())
                .path("data").path("token").asText();
    }
}
