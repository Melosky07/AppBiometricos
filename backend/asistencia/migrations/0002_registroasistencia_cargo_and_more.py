# Generated by Django 5.1.6 on 2025-03-13 16:47

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('asistencia', '0001_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='registroasistencia',
            name='cargo',
            field=models.CharField(blank=True, max_length=100, null=True),
        ),
        migrations.AddField(
            model_name='registroasistencia',
            name='dependencia',
            field=models.CharField(blank=True, max_length=100, null=True),
        ),
    ]
