package com.shouryuuko.aizo;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;


@SpringBootApplication
@EnableScheduling
public class AizoApplication {

	public static void main(String[] args) {
		SpringApplication.run(AizoApplication.class, args);
	}

}
