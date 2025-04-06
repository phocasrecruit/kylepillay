package com.phocas.exercise.desks.schema;

import java.util.List;
import java.util.Objects;
import java.util.Optional;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.phocassoftware.graphql.builder.annotations.Id;
import com.phocassoftware.graphql.builder.annotations.Mutation;
import com.phocassoftware.graphql.builder.annotations.Query;
import com.phocassoftware.graphql.database.manager.Table;
import com.phocas.exercise.desks.ApiContext;

public class Team extends Table {

    private String name;

    @JsonCreator
    public Team(String name) {
        this.name = name;
    }

    public String getName() {
        return name;
    }

	public void setName(String name) {
        this.name = name;
    }

    public List<Person> getMembers(ApiContext context) {
        return context.database().getLinks(this, Person.class);
    }

    @Override
    public int hashCode() {
        return Objects.hash(getId(), name);
    }

    @Override
    public boolean equals(Object obj) {
        if (this == obj) return true;
        if (obj == null || getClass() != obj.getClass()) return false;
        Team other = (Team) obj;
        return Objects.equals(getId(), other.getId()) &&
               Objects.equals(name, other.name);
    }

    @Query
    public static List<Team> teams(ApiContext context) {
        return context.database().query(Team.class);
    }

    @Mutation
    public static Team putTeam(ApiContext context, @Id Optional<String> id, String name) {
		if (id.isEmpty()) {
			Team newTeam = new Team(name);
			newTeam.setId(context.database().newId());
			return context.database().put(newTeam);
		}
		
		String teamId = id.get();
		Team existing = context.database().get(Team.class, teamId);
		
		if (existing == null) {
			Team newTeam = new Team(name);
			newTeam.setId(teamId);
			return context.database().put(newTeam);
		}
		
		existing.setName(name); 
		return context.database().put(existing);
    }
}