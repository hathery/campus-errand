package com.campus.errand;

import org.mybatis.spring.annotation.MapperScan;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.autoconfigure.security.servlet.UserDetailsServiceAutoConfiguration;
import org.springframework.boot.context.properties.ConfigurationPropertiesScan;
import org.springframework.scheduling.annotation.EnableScheduling;

/**
 * 校园跑腿系统启动类。
 */
@SpringBootApplication(exclude = UserDetailsServiceAutoConfiguration.class)
@MapperScan("com.campus.errand.mapper")
@ConfigurationPropertiesScan
@EnableScheduling
public class CampusErrandApplication {

    public static void main(String[] args) {
        SpringApplication.run(CampusErrandApplication.class, args);
    }
}
